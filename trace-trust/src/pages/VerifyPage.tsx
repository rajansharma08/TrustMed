import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Brain, ScanLine, ShieldCheck } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Scanner } from "@/components/Scanner";
import { Timeline } from "@/components/Timeline";
import { ResultPanel } from "@/components/ResultPanel";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { runAiMedicineRiskCheck } from "@/aiAnalysis";
import { CONTRACT_ADDRESS } from "@/config";
import { loadMedicineRecord } from "@/data";
import { resolveContractAddressForRead } from "@/eth";
import { parseQRPayload } from "@/utils";
import type { Checkpoint, Medicine, QRPayload, RiskAnalysisResult } from "@/types";
import { toTimelineCheckpoints, toTimelineMedicine } from "@/utils/timelineAdapter";

const VerifyPage = () => {
  const location = useLocation();
  const [payload, setPayload] = useState<QRPayload | null>(null);
  const [parseErr, setParseErr] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);

  const [analysisBusy, setAnalysisBusy] = useState(false);
  const [analysis, setAnalysis] = useState<RiskAnalysisResult | null>(null);
  const analysisRunRef = useRef(0);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);

  function parsePayload(text: string): boolean {
    setErr("");
    setMedicine(null);
    setCheckpoints([]);
    setAnalysis(null);
    setAnalysisBusy(false);

    try {
      const parsed = parseQRPayload(text.trim());
      setPayload(parsed);
      setParseErr("");
      return true;
    } catch (e: any) {
      setPayload(null);
      setParseErr("We couldn't read that QR code. Please scan a valid code.");
      return false;
    }
  }

  function handleScannerPayload(text: string): boolean {
    const ok = parsePayload(text);
    if (ok) setShowScanner(false);
    return ok;
  }

  function startScanAgain() {
    setShowScanner(true);
    setScannerKey((k) => k + 1);
  }

  async function load(contract: string, id: string) {
    setBusy(true);
    setErr("");
    setAnalysis(null);
    setAnalysisBusy(true);
    let resolvedHint = "";
    let resolvedAddress = contract;

    const runId = ++analysisRunRef.current;
    try {
      const resolved = await resolveContractAddressForRead(contract);
      resolvedHint = resolved.hint;
      resolvedAddress = resolved.address;
      const record = await loadMedicineRecord(resolvedAddress, id);
      setMedicine(record.medicine);
      setCheckpoints(record.checkpoints);

      const report = await runAiMedicineRiskCheck(record.medicine, record.checkpoints);
      if (runId === analysisRunRef.current) {
        setAnalysis(report.usedAi ? report : null);
      }
    } catch (e: any) {
      const message = String(e?.shortMessage || e?.message || e);
      const staleQrHint =
        resolvedHint || resolvedAddress !== contract || contract !== CONTRACT_ADDRESS
          ? "This QR code doesn't match the current demo. Please scan a fresh code."
          : "We couldn't verify this item right now. Please try again.";
      setErr(message.includes("was not found for this contract") ? staleQrHint : "We couldn't verify this item right now. Please try again.");
      setMedicine(null);
      setCheckpoints([]);
      if (runId === analysisRunRef.current) {
        setAnalysis(null);
      }
    } finally {
      setBusy(false);
      if (runId === analysisRunRef.current) {
        setAnalysisBusy(false);
      }
    }
  }

  useEffect(() => {
    if (payload) load(payload.contract, payload.medicineId).catch(() => {});
  }, [payload?.contract, payload?.medicineId]);

  useEffect(() => {
    if (!location.search) return;
    parsePayload(window.location.href);
  }, [location.search]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-display font-bold text-foreground">Check Your Medicine</h1>
          <p className="text-muted-foreground">Scan the QR code to view its verified journey.</p>
        </div>

        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-display font-semibold text-foreground">Scan QR Code</h2>
          </div>
          {!showScanner ? (
            <Button onClick={startScanAgain} className="gradient-primary text-primary-foreground border-0">
              {analysis || medicine ? "Scan Again" : "Start Scan"}
            </Button>
          ) : (
            <Scanner
              key={scannerKey}
              onScan={handleScannerPayload}
              autoStart
              showControls={false}
              allowStop={false}
              startLabel="Start Scan"
              qrBoxSize={320}
              className="min-h-[420px]"
            />
          )}
        </div>

        <div className="space-y-4">
          {parseErr && <ResultPanel type="error" title="Scan Failed" message={parseErr} />}
          {busy && <ResultPanel type="loading" title="Checking Record" message="Looking up this medicine's history..." />}
          {err && <ResultPanel type="error" title="Could Not Verify" message={err} />}
          {analysisBusy && (
            <ResultPanel
              type="loading"
              title="Checking for Safety Signals"
              message="Reviewing the timeline for unusual activity..."
            />
          )}
          {!busy && !analysisBusy && !medicine && !err && !parseErr && (
            <ResultPanel type="empty" title="Ready to Scan" message="Tap Start Scan and point your camera at the QR code." />
          )}
        </div>

        {!analysisBusy && analysis && analysis.usedAi && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-display font-semibold text-foreground">Safety Check</h2>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <StatusPill
                variant={analysis.verdict === "SUSPECT" ? "suspect" : analysis.verdict === "REVIEW" ? "review" : "legit"}
                className="text-sm px-4 py-1.5"
              >
                <ShieldCheck className="h-4 w-4" />
                {analysis.verdict}
              </StatusPill>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">Risk Level</span>
                  <span className="text-sm font-bold text-foreground">{analysis.suspicionScore.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${analysis.suspicionScore}%` }} />
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">{analysis.summary}</p>
            <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
              {(analysis.aiHighlights?.length ? analysis.aiHighlights : analysis.highlights).map((highlight, index) => (
                <li key={`${index}-${highlight}`}>{highlight}</li>
              ))}
            </ul>
            <pre className="max-h-[28rem] overflow-auto text-xs whitespace-pre-wrap break-words rounded-lg bg-secondary/50 p-3 text-muted-foreground">
              {analysis.aiNarrative}
            </pre>
          </motion.div>
        )}

        {!busy && medicine && (
          <Timeline medicine={toTimelineMedicine(medicine)} checkpoints={toTimelineCheckpoints(checkpoints)} />
        )}
      </motion.div>
    </div>
  );
};

export default VerifyPage;
