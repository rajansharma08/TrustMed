import { GEMINI_API_KEY, GEMINI_MODEL } from "./config";
import type { Checkpoint, Medicine, RiskAnalysisResult, RiskVerdict } from "./types";

type Policy = {
  stripsPerBox: number;
  expectedTransitChecks: number;
  stripTolerancePct: number;
};

type ParsedCheckpoint = {
  timestampSec: number;
  location: string;
  status: string;
  notes: string;
  scanMode: "BOX" | "STRIP";
  scannedUnits: number | null;
  reportedAt: string | null;
};

type LocalRisk = {
  verdict: RiskVerdict;
  suspicionScore: number;
  summary: string;
  highlights: string[];
  diagnostics: string[];
};

const DEFAULT_POLICY: Policy = {
  stripsPerBox: 50,
  expectedTransitChecks: 4,
  stripTolerancePct: 5,
};

const LOCATION_COORDS: Record<string, [number, number]> = {
  singapore: [1.3521, 103.8198],
  batam: [1.0456, 104.0305],
  jakarta: [-6.2088, 106.8456],
  surabaya: [-7.2575, 112.7521],
  delhi: [28.6139, 77.209],
  mumbai: [19.076, 72.8777],
  chennai: [13.0827, 80.2707],
  kolkata: [22.5726, 88.3639],
  bengaluru: [12.9716, 77.5946],
  hyderabad: [17.385, 78.4867],
  pune: [18.5204, 73.8567],
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function normalizeLocation(raw: string): string {
  return raw
    .replace(/\(reported at [^)]+\)/gi, "")
    .replace(/\[reportedAt=[^\]]+\]/gi, "")
    .trim();
}

function parsePolicy(metadataURI: string): Policy {
  const policy: Policy = { ...DEFAULT_POLICY };
  const strips = /stripsPerBox=(\d+)/i.exec(metadataURI);
  const transit = /expectedTransitChecks=(\d+)/i.exec(metadataURI);
  const tolerance = /stripTolerancePct=(\d+)/i.exec(metadataURI);

  if (strips) policy.stripsPerBox = Math.max(1, Number(strips[1]));
  if (transit) policy.expectedTransitChecks = Math.max(1, Number(transit[1]));
  if (tolerance) policy.stripTolerancePct = clamp(Number(tolerance[1]), 0, 50);
  return policy;
}

function parseCheckpoint(cp: Checkpoint): ParsedCheckpoint {
  const notes = cp.notes || "";
  const modeMatch = /\[scanMode=(BOX|STRIP)\]/i.exec(notes);
  const unitsMatch = /\[scannedUnits=(\d+)\]/i.exec(notes);
  const reportedMatch = /\[reportedAt=([^\]]+)\]/i.exec(notes);
  const locationReportedMatch = /\(reported at ([^)]+)\)/i.exec(cp.location || "");

  const parseReportedAtSeconds = (value: string | null): number | null => {
    if (!value) return null;
    const raw = value.trim();
    const direct = new Date(raw);
    if (!Number.isNaN(direct.getTime())) return Math.floor(direct.getTime() / 1000);
    const normalized = new Date(raw.replace(" ", "T"));
    if (!Number.isNaN(normalized.getTime())) return Math.floor(normalized.getTime() / 1000);
    return null;
  };

  const reportedAt = reportedMatch?.[1] || locationReportedMatch?.[1] || null;
  const reportedAtSeconds = parseReportedAtSeconds(reportedAt);

  return {
    // Prefer form-entered reported time; fallback to on-chain block timestamp.
    timestampSec: reportedAtSeconds ?? Number(cp.timestamp),
    location: normalizeLocation(cp.location || ""),
    status: cp.status || "",
    notes: notes
      .replace(/\[scanMode=[^\]]+\]/gi, "")
      .replace(/\[scannedUnits=[^\]]+\]/gi, "")
      .replace(/\[reportedAt=[^\]]+\]/gi, "")
      .trim(),
    scanMode: (modeMatch?.[1]?.toUpperCase() === "STRIP" ? "STRIP" : "BOX"),
    scannedUnits: unitsMatch ? Number(unitsMatch[1]) : null,
    reportedAt,
  };
}

function findCoords(location: string): [number, number] | null {
  const lower = location.toLowerCase();
  for (const [key, coords] of Object.entries(LOCATION_COORDS)) {
    if (lower.includes(key)) return coords;
  }
  return null;
}

function haversineKm(a: [number, number], b: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const q =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 6371 * (2 * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q)));
}

function buildLocalRisk(medicine: Medicine, checkpoints: Checkpoint[]): LocalRisk {
  const parsed = checkpoints.map(parseCheckpoint).sort((a, b) => a.timestampSec - b.timestampSec);
  const policy = parsePolicy(medicine.metadataURI || "");

  let score = 0;
  const highlights: string[] = [];
  const diagnostics: string[] = [];

  // Transit count consistency
  if (parsed.length !== policy.expectedTransitChecks) {
    const gap = Math.abs(parsed.length - policy.expectedTransitChecks);
    const delta = Math.min(20, gap * 3);
    score += delta;
    highlights.push(
      `Transit checkpoint count mismatch: observed ${parsed.length}, expected ${policy.expectedTransitChecks}.`
    );
  }

  // Strip/box scan consistency
  for (const cp of parsed) {
    if (cp.scanMode === "STRIP") {
      const units = cp.scannedUnits ?? policy.stripsPerBox;
      const allowedGap = Math.round((policy.stripsPerBox * policy.stripTolerancePct) / 100);
      const diff = Math.abs(units - policy.stripsPerBox);
      if (diff > allowedGap) {
        const delta = Math.min(25, (diff / policy.stripsPerBox) * 100);
        score += delta;
        highlights.push(
          `Strip count anomaly at "${cp.location || "unknown"}": scanned ${units}, expected ${policy.stripsPerBox}.`
        );
      }
    } else if (cp.scannedUnits !== null && cp.scannedUnits !== 1) {
      score += Math.min(12, Math.abs(cp.scannedUnits - 1) * 2);
      highlights.push(`Box scan anomaly at "${cp.location || "unknown"}": expected 1 box QR scan.`);
    }
  }

  // Feasibility checks: distance vs time
  // Real-world transit logs often vary by ~1 hour. Treat that as normal.
  const avgFeasibleSpeed = 60; // km/h
  const transitGraceHours = 1; // no suspicion inside this timing variance band
  const suspicionPerHourAfterGrace = 0.5; // gentler slope after grace period
  for (let i = 1; i < parsed.length; i++) {
    const prev = parsed[i - 1];
    const curr = parsed[i];
    const dtSec = curr.timestampSec - prev.timestampSec;
    const dtHours = dtSec / 3600;

    if (dtSec <= 0 && prev.location !== curr.location) {
      score += 25;
      highlights.push(`Impossible sequence: same/earlier time at different locations.`);
    }

    const a = findCoords(prev.location);
    const b = findCoords(curr.location);
    if (a && b && dtHours > 0) {
      const distKm = haversineKm(a, b);
      const minHours = distKm / avgFeasibleSpeed;
      if (dtHours < minHours - transitGraceHours) {
        const shortfallBeyondGrace = minHours - dtHours - transitGraceHours;
        const delta = Math.min(20, shortfallBeyondGrace * suspicionPerHourAfterGrace);
        if (delta >= 0.5) {
          score += delta;
          highlights.push(
            `Transit may be infeasible: ${prev.location} -> ${curr.location}, short by ${shortfallBeyondGrace.toFixed(
              1
            )}h beyond ${transitGraceHours}h grace.`
          );
        }
      }
      diagnostics.push(
        `Leg ${i}: ${prev.location} -> ${curr.location}, ${distKm.toFixed(1)}km, actual ${dtHours.toFixed(
          2
        )}h, minimum ${minHours.toFixed(2)}h (grace ${transitGraceHours.toFixed(2)}h).`
      );
    }
  }

  // Same-time different-place conflicts
  for (let i = 0; i < parsed.length; i++) {
    for (let j = i + 1; j < parsed.length; j++) {
      const a = parsed[i];
      const b = parsed[j];
      const dt = Math.abs(a.timestampSec - b.timestampSec);
      if (dt > 300) continue; // 5 minutes window
      if (a.location === b.location) continue;
      score += 20;
      highlights.push(`Near-simultaneous scans found at different locations.`);
    }
  }

  const suspicionScore = clamp(Number(score.toFixed(2)), 0, 100);
  const verdict: RiskVerdict =
    suspicionScore >= 50 ? "SUSPECT" : suspicionScore >= 25 ? "REVIEW" : "LEGIT";
  const summary =
    verdict === "SUSPECT"
      ? "High anomaly risk detected across transit feasibility and/or scan consistency."
      : verdict === "REVIEW"
        ? "Some anomalies detected. Record needs manual review."
        : "No strong anomaly signal detected from current checkpoint evidence.";

  if (highlights.length === 0) {
    highlights.push("Checkpoint sequence and scan counts look internally consistent.");
  }

  return { verdict, suspicionScore, summary, highlights, diagnostics };
}

async function askGemini(prompt: string): Promise<{ text: string; finishReason?: string }> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      GEMINI_MODEL
    )}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1200 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini API error (${res.status})`);
  const data = await res.json();
  const firstCandidate = data?.candidates?.[0];
  const text = (data?.candidates || [])
    .flatMap((c: any) => c?.content?.parts || [])
    .map((p: any) => p?.text || "")
    .join("\n")
    .trim();
  if (!text) throw new Error("Empty Gemini response");
  return { text, finishReason: firstCandidate?.finishReason };
}

function parseGeminiSignal(text: string): { verdict: RiskVerdict | null; score: number | null; summary: string | null } {
  const verdictMatch = /Verdict:\s*(LEGIT|REVIEW|SUSPECT)/i.exec(text);
  const scoreMatch = /Suspicion\s*Level:\s*(\d{1,3})\s*%/i.exec(text);
  const summaryMatch = /Summary:\s*(.+)/i.exec(text);
  return {
    verdict: verdictMatch ? (verdictMatch[1].toUpperCase() as RiskVerdict) : null,
    score: scoreMatch ? clamp(Number(scoreMatch[1]), 0, 100) : null,
    summary: summaryMatch?.[1]?.trim() || null,
  };
}

function isLikelyCompleteSummary(summary: string | null): boolean {
  if (!summary) return false;
  const s = summary.trim();
  if (s.length < 16) return false;
  if (/\b(or|and|because|with|for|to)$/i.test(s)) return false;
  return /[.!?]$/.test(s);
}

export async function runAiMedicineRiskCheck(
  medicine: Medicine,
  checkpoints: Checkpoint[]
): Promise<RiskAnalysisResult> {
  const local = buildLocalRisk(medicine, checkpoints);
  const checkpointsView = checkpoints
    .map((cp, idx) => {
      const ts = Number(cp.timestamp) * 1000;
      return `${idx + 1}. ${new Date(ts).toISOString()} | ${cp.location} | ${cp.status} | ${cp.notes || "-"}`;
    })
    .join("\n");

  if (!GEMINI_API_KEY) {
    return {
      ...local,
      aiNarrative:
        "Gemini API key not configured (set VITE_GEMINI_API_KEY). Showing local anomaly analysis.",
      usedGemini: false,
    };
  }

  const prompt = [
    "You are a pharma anti-counterfeit auditor.",
    "Given this medicine record and local anomaly calculations, produce a concise report.",
    "Important timing rule: up to 1 hour transit variance is normal and should add 0% suspicion.",
    "Only after this grace period, increase suspicion gently (about 0.5% per extra hour of infeasibility).",
    "Also flag near-same-time scans from different locations and strip-count mismatch.",
    "Return plain text only in this exact structure:",
    "Verdict: LEGIT|REVIEW|SUSPECT",
    "Suspicion Level: NN%",
    "Summary: <1 sentence>",
    "Key Alerts:",
    "- <bullet 1>",
    "- <bullet 2>",
    "Recommendation:",
    "- <bullet>",
    "",
    `Medicine metadataURI: ${medicine.metadataURI || "(none)"}`,
    `Local verdict: ${local.verdict}`,
    `Local suspicion score: ${local.suspicionScore}%`,
    `Local summary: ${local.summary}`,
    `Local highlights: ${local.highlights.join(" | ")}`,
    `Local diagnostics: ${local.diagnostics.join(" | ")}`,
    "Checkpoint timeline:",
    checkpointsView || "(none)",
  ].join("\n");

  try {
    const ai = await askGemini(prompt);
    const parsed = parseGeminiSignal(ai.text);
    const summary = isLikelyCompleteSummary(parsed.summary) ? parsed.summary! : local.summary;
    const aiNarrative =
      ai.finishReason === "MAX_TOKENS"
        ? `${ai.text}\n\n`
        : ai.text;
    const hasOnlyConsistencyNote =
      local.highlights.length === 1 &&
      /internally consistent/i.test(local.highlights[0]);
    const geminiConflictsWithDeterministic =
      !!parsed.verdict &&
      parsed.verdict !== local.verdict &&
      local.suspicionScore <= 20 &&
      hasOnlyConsistencyNote;

    const finalVerdict = geminiConflictsWithDeterministic
      ? local.verdict
      : (parsed.verdict || local.verdict);
    const finalScore = geminiConflictsWithDeterministic
      ? local.suspicionScore
      : (parsed.score ?? local.suspicionScore);
    const finalSummary = geminiConflictsWithDeterministic ? local.summary : summary;
    const finalNarrative = geminiConflictsWithDeterministic
      ? `${aiNarrative}\n\n[Note: Gemini verdict conflicted with deterministic checks; local verdict applied.]`
      : aiNarrative;

    return {
      verdict: finalVerdict,
      suspicionScore: finalScore,
      summary: finalSummary,
      highlights: local.highlights,
      aiNarrative: finalNarrative,
      usedGemini: true,
    };
  } catch (e: any) {
    return {
      ...local,
      aiNarrative: `Gemini analysis unavailable: ${String(e?.message || e)}. Showing local anomaly analysis.`,
      usedGemini: false,
    };
  }
}
