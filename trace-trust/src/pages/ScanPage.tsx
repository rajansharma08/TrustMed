import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, FileScan, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/FormField";
import { ResultPanel } from "@/components/ResultPanel";
import { Timeline } from "@/components/Timeline";
import { Scanner } from "@/components/Scanner";
import { useWallet } from "@/contexts/WalletContext";
import { CONTRACT_ADDRESS } from "@/config";
import { getContractWrite, getWalletAddress, isWalletSessionActive, resolveContractAddressForRead } from "@/eth";
import { loadMedicineRecord } from "@/data";
import { parseQRPayload, shortAddr } from "@/utils";
import type { Checkpoint, Medicine, QRPayload } from "@/types";
import { toTimelineCheckpoints, toTimelineMedicine } from "@/utils/timelineAdapter";

function localDateTimeNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const ScanPage = () => {
  const { isConnected } = useWallet();
  const [raw, setRaw] = useState("");
  const [payload, setPayload] = useState<QRPayload | null>(null);
  const [parseErr, setParseErr] = useState("");

  const [location, setLocation] = useState("MT Consignment Warehouse Batam");
  const [checkpointTime, setCheckpointTime] = useState(localDateTimeNow());
  const [status, setStatus] = useState("RECEIVED");
  const [scanMode, setScanMode] = useState<"BOX" | "STRIP">("BOX");
  const [scannedUnits, setScannedUnits] = useState("1");
  const [notes, setNotes] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [recordBusy, setRecordBusy] = useState(false);
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [activeContract, setActiveContract] = useState("");
  const [contractHint, setContractHint] = useState("");

  function handlePayload(text: string): boolean {
    setRaw(text);
    setOk("");
    setErr("");
    setMedicine(null);
    setCheckpoints([]);
    try {
      const parsed = parseQRPayload(text.trim());
      setPayload(parsed);
      setParseErr("");
      return true;
    } catch (e: any) {
      setPayload(null);
      setParseErr(String(e?.message || e));
      return false;
    }
  }

  async function loadRecord(current: QRPayload) {
    setRecordBusy(true);
    setErr("");
    setContractHint("");
    let resolvedHint = "";
    let resolvedAddress = current.contract;
    try {
      const resolved = await resolveContractAddressForRead(current.contract);
      resolvedAddress = resolved.address;
      resolvedHint = resolved.hint;
      setActiveContract(resolvedAddress);
      setContractHint(resolvedHint);
      const record = await loadMedicineRecord(resolvedAddress, current.medicineId);
      setMedicine(record.medicine);
      setCheckpoints(record.checkpoints);
    } catch (e: any) {
      const message = String(e?.shortMessage || e?.message || e);
      const staleQrHint =
        resolvedHint || resolvedAddress !== current.contract || current.contract !== CONTRACT_ADDRESS
          ? " This QR may belong to a previous local deployment. Create a fresh medicine and use the newly generated QR."
          : "";
      setErr(message.includes("was not found for this contract") ? `${message}${staleQrHint}` : message);
    } finally {
      setRecordBusy(false);
    }
  }

  useEffect(() => {
    if (payload) loadRecord(payload).catch(() => {});
  }, [payload?.contract, payload?.medicineId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setOk("");
    if (!payload) return;

    try {
      if (!isWalletSessionActive()) {
        throw new Error("Login required. Please click Login in the wallet section.");
      }
      const active = (await getWalletAddress()).toLowerCase();

      setBusy(true);
      const contractToUse = activeContract || (await resolveContractAddressForRead(payload.contract)).address;
      const c = await getContractWrite(contractToUse);
      const participantRole = await c.PARTICIPANT_ROLE();
      const hasParticipantRole: boolean = await c.hasRole(participantRole, active);
      if (!hasParticipantRole) {
        throw new Error(
          `Wallet ${shortAddr(active)} is missing PARTICIPANT_ROLE on this contract. Grant role first, then retry.`,
        );
      }

      const notesWithMeta = [
        `[reportedAt=${checkpointTime}]`,
        `[scanMode=${scanMode}]`,
        `[scannedUnits=${Math.max(1, Number(scannedUnits) || 1)}]`,
        notes.trim(),
      ]
        .filter(Boolean)
        .join(" ");

      const tx = await c.addCheckpoint(BigInt(payload.medicineId), location, status, notesWithMeta);
      await tx.wait();

      setOk("Checkpoint added on-chain.");
      setNotes("");
      setCheckpointTime(localDateTimeNow());
      setScannedUnits(scanMode === "STRIP" ? "50" : "1");
      await loadRecord(payload);
    } catch (e: any) {
      setErr(String(e?.shortMessage || e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = !!payload && isConnected && !busy;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Scan + Add Step</h1>
          <p className="text-muted-foreground mt-1">Scan medicine QR and append a supply-chain checkpoint on-chain.</p>
        </div>

        {!isConnected && (
          <ResultPanel type="warning" title="Not Connected" message="Please login to add transit checkpoints." />
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <Scanner onScan={handlePayload} autoStart={false} showControls allowStop startLabel="Scan Now" />

          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <FileScan className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-display font-semibold text-foreground">QR Payload</h2>
            </div>
            <FormField
              label="Scanned Payload"
              id="rawPayload"
              textarea
              value={raw}
              onChange={handlePayload}
              placeholder='Paste payload JSON, medtrace://..., or URL query format'
            />
            {parseErr && <ResultPanel type="error" title="Parse Error" message={parseErr} />}
            {payload && (
              <ResultPanel
                type="info"
                title={`Medicine #${payload.medicineId}`}
                message={`contract: ${activeContract || payload.contract} | chainId: ${payload.chainId}`}
              />
            )}
            {contractHint && <ResultPanel type="warning" title="Contract Fallback" message={contractHint} />}
          </div>
        </div>

        {payload && (
          <div className="grid lg:grid-cols-2 gap-6">
            <form onSubmit={submit} className="glass-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-display font-semibold text-foreground">Add Checkpoint</h2>
              </div>

              <FormField label="Location" id="location" value={location} onChange={setLocation} required disabled={!canSubmit} />
              <FormField
                label="Checkpoint Time"
                id="checkpointTime"
                type="datetime-local"
                value={checkpointTime}
                onChange={setCheckpointTime}
                required
                disabled={!canSubmit}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Scan Mode"
                  id="scanMode"
                  value={scanMode}
                  onChange={(v) => {
                    const mode = v === "STRIP" ? "STRIP" : "BOX";
                    setScanMode(mode);
                    setScannedUnits(mode === "STRIP" ? "50" : "1");
                  }}
                  options={[
                    { label: "BOX", value: "BOX" },
                    { label: "STRIP", value: "STRIP" },
                  ]}
                  disabled={!canSubmit}
                />
                <FormField
                  label="Scanned Units"
                  id="scannedUnits"
                  type="number"
                  value={scannedUnits}
                  onChange={setScannedUnits}
                  required
                  disabled={!canSubmit}
                />
              </div>

              <FormField label="Status" id="status" value={status} onChange={setStatus} required disabled={!canSubmit} />
              <FormField label="Notes (optional)" id="notes" value={notes} onChange={setNotes} textarea disabled={!canSubmit} />

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={!canSubmit} className="gradient-primary text-primary-foreground border-0 px-6">
                  {busy ? "Submitting..." : "Add Step on Blockchain"}
                </Button>
                {!canSubmit && !busy && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {!isConnected ? "Login required" : "Wallet check pending"}
                  </span>
                )}
              </div>

              {ok && <ResultPanel type="success" title="Success" message={ok} />}
              {err && <ResultPanel type="error" title="Add Checkpoint Failed" message={err} />}
            </form>

            <div className="space-y-4">
              {recordBusy && <ResultPanel type="loading" title="Loading Record" message="Fetching medicine and checkpoints..." />}
              {!recordBusy && medicine && (
                <Timeline medicine={toTimelineMedicine(medicine)} checkpoints={toTimelineCheckpoints(checkpoints)} />
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ScanPage;
