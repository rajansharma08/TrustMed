import type { Checkpoint } from "@/components/Timeline";
import { getContractRead } from "@/eth";
import { fromUnixSeconds } from "@/utils";

export interface Medicine {
  medicineId: string;
  name: string;
  batch: string;
  manufacturer: string;
  mfgDate: string;
  expDate: string;
  metadataUri: string;
  creator: string;
  verdict: "LEGIT" | "REVIEW" | "SUSPECT";
  suspicion: number;
}

export interface DashboardCheckpoint extends Checkpoint {
  medicineId: string;
}

export interface FlaggedCase {
  medicineId: string;
  flags: string[];
  suspicion: number;
  recommendation: string;
}

export interface SupplySnapshot {
  legit: number;
  review: number;
  suspect: number;
  inTransit: number;
  delivered: number;
  created: number;
  transitEvents: number;
}

const DASHBOARD_MAX_MEDICINE_ID = Number((import.meta as any).env?.VITE_DASHBOARD_MAX_MEDICINE_ID || 250);
const DASHBOARD_SCAN_MISS_LIMIT = Number((import.meta as any).env?.VITE_DASHBOARD_SCAN_MISS_LIMIT || 60);

function formatDateTime(ts: bigint): string {
  const n = Number(ts);
  if (!Number.isFinite(n)) return String(ts);
  return new Date(n * 1000).toISOString().slice(0, 16).replace("T", " ");
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function parseCheckpointMeta(notes: string) {
  const reportedBracket = /\[reportedAt=([^\]]+)\]/i.exec(notes || "");
  const scanModeBracket = /\[scanMode=(BOX|STRIP)\]/i.exec(notes || "");
  const scannedUnitsBracket = /\[scannedUnits=(\d+)\]/i.exec(notes || "");

  const reportedColon = /reportedAt:([^;]+)/i.exec(notes || "");
  const scanModeColon = /scanMode:(BOX|STRIP)/i.exec(notes || "");
  const scannedUnitsColon = /scannedUnits:(\d+)/i.exec(notes || "");

  const reportedAt = reportedBracket?.[1] || reportedColon?.[1]?.trim() || "";
  const scanMode = (scanModeBracket?.[1] || scanModeColon?.[1] || "BOX").toUpperCase() as "BOX" | "STRIP";
  const scannedUnits = Math.max(1, Number(scannedUnitsBracket?.[1] || scannedUnitsColon?.[1] || 1));
  const cleanNotes = (notes || "")
    .replace(/\[reportedAt=[^\]]+\]/gi, "")
    .replace(/\[scanMode=[^\]]+\]/gi, "")
    .replace(/\[scannedUnits=[^\]]+\]/gi, "")
    .replace(/reportedAt:[^;]+;?/gi, "")
    .replace(/scanMode:[^;]+;?/gi, "")
    .replace(/scannedUnits:[^;]+;?/gi, "")
    .trim();

  return { reportedAt, scanMode, scannedUnits, cleanNotes };
}

function inferVerdict(checkpoints: DashboardCheckpoint[]): { verdict: Medicine["verdict"]; suspicion: number } {
  let suspicion = 5;
  if (checkpoints.length < 2) suspicion += 18;

  for (const cp of checkpoints) {
    const status = cp.status.toLowerCase();
    const notes = cp.notes.toLowerCase();

    if (status.includes("fail") || status.includes("reject") || status.includes("hold")) suspicion += 35;
    if (notes.includes("tamper") || notes.includes("counterfeit") || notes.includes("mismatch")) suspicion += 28;
    if (cp.scanMode === "STRIP" && cp.scannedUnits < 40) suspicion += 12;
  }

  if (checkpoints.length) {
    const last = checkpoints[checkpoints.length - 1].status.toLowerCase();
    if (last === "delivered") suspicion -= 8;
  }

  suspicion = clamp(suspicion);
  const verdict: Medicine["verdict"] = suspicion >= 50 ? "SUSPECT" : suspicion >= 25 ? "REVIEW" : "LEGIT";
  return { verdict, suspicion: Math.round(suspicion) };
}

export async function loadDashboardData(): Promise<{
  medicines: Medicine[];
  checkpoints: DashboardCheckpoint[];
}> {
  const c = getContractRead();
  const medicines: Medicine[] = [];
  const checkpoints: DashboardCheckpoint[] = [];
  let globalCheckpointId = 1;
  let misses = 0;

  for (let i = 1; i <= DASHBOARD_MAX_MEDICINE_ID; i++) {
    const id = BigInt(i);
    const exists = await c.medicineExists(id);
    if (!exists) {
      misses++;
      if (misses >= DASHBOARD_SCAN_MISS_LIMIT) break;
      continue;
    }

    misses = 0;
    const m = await c.getMedicine(id);
    const count = Number(await c.checkpointCount(id));
    const medicineCheckpoints: DashboardCheckpoint[] = [];

    for (let j = 0; j < count; j++) {
      const cp = await c.getCheckpoint(id, BigInt(j));
      const parsed = parseCheckpointMeta(cp[4] || "");
      const ts = formatDateTime(cp[0]);

      const row: DashboardCheckpoint = {
        id: globalCheckpointId++,
        medicineId: `MED-${i}`,
        status: cp[3] || "Checkpoint",
        location: cp[2] || "(not provided)",
        actor: cp[1] || "",
        eventTimestamp: ts,
        reportedTime: parsed.reportedAt || ts,
        scanMode: parsed.scanMode,
        scannedUnits: parsed.scannedUnits,
        notes: parsed.cleanNotes,
      };
      medicineCheckpoints.push(row);
      checkpoints.push(row);
    }

    medicineCheckpoints.sort((a, b) => a.eventTimestamp.localeCompare(b.eventTimestamp));
    const risk = inferVerdict(medicineCheckpoints);

    medicines.push({
      medicineId: `MED-${i}`,
      name: m[0],
      batch: m[1],
      manufacturer: m[2],
      mfgDate: fromUnixSeconds(m[3]),
      expDate: fromUnixSeconds(m[4]),
      metadataUri: m[5],
      creator: m[6],
      verdict: risk.verdict,
      suspicion: risk.suspicion,
    });
  }

  checkpoints.sort((a, b) => b.eventTimestamp.localeCompare(a.eventTimestamp));
  return { medicines, checkpoints };
}

// ---------- Aggregations ----------

export function getKpis(medicines: Medicine[], checkpoints: DashboardCheckpoint[]) {
  const totalMedicines = medicines.length;
  const totalCheckpoints = checkpoints.length;
  const avgSuspicion = medicines.length ? Math.round(medicines.reduce((s, m) => s + m.suspicion, 0) / medicines.length) : 0;
  const suspectCases = medicines.filter((m) => m.verdict === "SUSPECT").length;
  const boxScans = checkpoints.filter((c) => c.scanMode === "BOX").length;
  const stripScans = checkpoints.filter((c) => c.scanMode === "STRIP").length;
  const in30 = medicines.filter((m) => {
    const exp = new Date(m.expDate);
    const now = new Date();
    const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  }).length;

  return {
    totalMedicines,
    totalCheckpoints,
    avgSuspicion,
    suspectCases,
    boxScans,
    stripScans,
    boxStripRatio: stripScans ? `${(boxScans / stripScans).toFixed(1)}:1` : `${boxScans}:0`,
    expiringIn30: in30,
  };
}

export function getCheckpointsOverTime(checkpoints: DashboardCheckpoint[]) {
  const map: Record<string, number> = {};
  checkpoints.forEach((c) => {
    const day = c.eventTimestamp.slice(0, 10);
    map[day] = (map[day] || 0) + 1;
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

export function getTopLocations(checkpoints: DashboardCheckpoint[]) {
  const map: Record<string, number> = {};
  checkpoints.forEach((c) => {
    map[c.location] = (map[c.location] || 0) + 1;
  });
  return Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([location, count]) => ({ location, count }));
}

export function getVerdictSplit(medicines: Medicine[]) {
  const map: Record<string, number> = { LEGIT: 0, REVIEW: 0, SUSPECT: 0 };
  medicines.forEach((m) => {
    map[m.verdict] = (map[m.verdict] || 0) + 1;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

export function getBoxStripByLocation(checkpoints: DashboardCheckpoint[]) {
  const map: Record<string, { location: string; BOX: number; STRIP: number }> = {};
  checkpoints.forEach((c) => {
    if (!map[c.location]) map[c.location] = { location: c.location, BOX: 0, STRIP: 0 };
    if (c.scanMode === "BOX") map[c.location].BOX++;
    else map[c.location].STRIP++;
  });
  return Object.values(map)
    .sort((a, b) => b.BOX + b.STRIP - (a.BOX + a.STRIP))
    .slice(0, 8);
}

export function getFlaggedCases(medicines: Medicine[]): FlaggedCase[] {
  return medicines
    .filter((m) => m.verdict !== "LEGIT")
    .map((m) => ({
      medicineId: m.medicineId,
      flags: m.verdict === "SUSPECT" ? ["High suspicion", "Potential counterfeit signal"] : ["Moderate anomaly", "Needs review"],
      suspicion: m.suspicion,
      recommendation: m.verdict === "SUSPECT" ? "Quarantine immediately" : "Manual review recommended",
    }));
}

export function getSupplySnapshot(medicines: Medicine[], checkpoints: DashboardCheckpoint[]): SupplySnapshot {
  const legit = medicines.filter((m) => m.verdict === "LEGIT").length;
  const review = medicines.filter((m) => m.verdict === "REVIEW").length;
  const suspect = medicines.filter((m) => m.verdict === "SUSPECT").length;

  const latestByMedicine = new Map<string, DashboardCheckpoint>();
  for (const cp of checkpoints) {
    const prev = latestByMedicine.get(cp.medicineId);
    if (!prev || cp.eventTimestamp > prev.eventTimestamp) {
      latestByMedicine.set(cp.medicineId, cp);
    }
  }

  let inTransit = 0;
  let delivered = 0;
  let created = 0;
  for (const cp of latestByMedicine.values()) {
    const status = cp.status.toLowerCase();
    if (status === "delivered") delivered++;
    else if (status === "created") created++;
    else if (status.includes("transit") || status === "checkpoint") inTransit++;
  }

  const transitEvents = checkpoints.filter((c) => {
    const status = c.status.toLowerCase();
    return status.includes("transit") || status === "checkpoint";
  }).length;

  return { legit, review, suspect, inTransit, delivered, created, transitEvents };
}

export function getRecentTransitFeed(checkpoints: DashboardCheckpoint[], limit = 8): DashboardCheckpoint[] {
  return checkpoints
    .filter((c) => {
      const status = c.status.toLowerCase();
      return status.includes("transit") || status === "checkpoint" || status === "delivered";
    })
    .sort((a, b) => b.eventTimestamp.localeCompare(a.eventTimestamp))
    .slice(0, limit);
}
