import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/FormField";
import { ResultPanel } from "@/components/ResultPanel";
import { QRCodeBox } from "@/components/QRCodeBox";
import { useWallet } from "@/contexts/WalletContext";
import { CHAIN_ID, CONTRACT_ADDRESS, VERIFY_BASE_URL } from "@/config";
import { getContractWrite, getWalletAddress, isWalletSessionActive, resolvePreferredContractAddress } from "@/eth";
import { buildQRPayload, buildVerifyUrl, toUnixSeconds } from "@/utils";

function localDateTimeNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localDateTimeAfterOneYear(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const CreatePage = () => {
  const { isConnected } = useWallet();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [medicineId, setMedicineId] = useState("");
  const [contractHint, setContractHint] = useState("");
  const [createdContractAddress, setCreatedContractAddress] = useState("");
  const runtimeHostname = typeof window !== "undefined" ? window.location.hostname : "";
  const usingLocalhostBase = /^(localhost|127\.0\.0\.1)$/i.test(runtimeHostname) && !VERIFY_BASE_URL;

  const [form, setForm] = useState({
    name: "Paracetamol 500mg",
    batch: "BATCH-YYYY-0001",
    manufacturerName: "Your Pharma Co.",
    mfgDateTime: localDateTimeNow(),
    expDateTime: localDateTimeAfterOneYear(),
    metadataURI: "ipfs://",
    stripsPerBox: "50",
    expectedTransitChecks: "4",
    stripTolerancePct: "5",
    originLocation: "MT Singapore",
    originCheckpointTime: localDateTimeNow(),
  });

  const update = (key: string) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const canSubmit = isConnected && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMedicineId("");
    setContractHint("");
    setCreatedContractAddress("");

    try {
      if (!isWalletSessionActive()) {
        throw new Error("Login required. Please click Login in the wallet section.");
      }

      const active = (await getWalletAddress()).toLowerCase();

      setBusy(true);
      const resolved = await resolvePreferredContractAddress();
      setContractHint(resolved.hint);
      setCreatedContractAddress(resolved.address);
      const c = await getContractWrite(resolved.address);
      const manufacturerRole = await c.MANUFACTURER_ROLE();
      const hasManufacturerRole: boolean = await c.hasRole(manufacturerRole, active);
      if (!hasManufacturerRole) {
        throw new Error("Connected wallet is missing MANUFACTURER_ROLE on this contract.");
      }
      const expectedMedicineId: bigint = await c.nextMedicineId();

      const originLocationWithTime = `${form.originLocation} (reported at ${form.originCheckpointTime})`;
      const policyTag = `policy://stripsPerBox=${Math.max(
        1,
        Number(form.stripsPerBox) || 50,
      )};expectedTransitChecks=${Math.max(
        1,
        Number(form.expectedTransitChecks) || 4,
      )};stripTolerancePct=${Math.max(0, Number(form.stripTolerancePct) || 5)};boxQrPerBox=1`;
      const metadataWithPolicy = form.metadataURI.trim() ? `${form.metadataURI.trim()} | ${policyTag}` : policyTag;

      const tx = await c.createMedicine(
        form.name,
        form.batch,
        form.manufacturerName,
        toUnixSeconds(form.mfgDateTime),
        toUnixSeconds(form.expDateTime),
        metadataWithPolicy,
        originLocationWithTime,
      );

      const receipt = await tx.wait();
      const eventLog = receipt?.logs?.find?.((log: any) => log?.fragment?.name === "MedicineCreated");
      const eventId = eventLog?.args?.medicineId?.toString?.();
      const fallbackExists: boolean = await c.medicineExists(expectedMedicineId);
      const fallbackId = fallbackExists ? expectedMedicineId.toString() : "";
      const id = eventId || fallbackId;
      if (!id) {
        throw new Error("Medicine created, but the app could not confirm the new medicineId.");
      }
      setMedicineId(id);
    } catch (e: any) {
      setError(String(e?.shortMessage || e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  const qrValue = useMemo(
    () => {
      if (!medicineId) return "";
      const payload = buildQRPayload(CHAIN_ID, createdContractAddress || CONTRACT_ADDRESS, medicineId);
      const runtimeBaseUrl = typeof window !== "undefined" ? window.location.origin : "";
      return buildVerifyUrl(VERIFY_BASE_URL, payload, runtimeBaseUrl);
    },
    [createdContractAddress, medicineId],
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Create Medicine + QR</h1>
          <p className="text-muted-foreground mt-1">
            Register a new medicine batch on-chain and generate a QR payload for verification.
          </p>
        </div>

        {!isConnected && (
          <ResultPanel type="warning" title="Not Connected" message="Please login to create medicines on the blockchain." />
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <form onSubmit={submit} className="glass-card p-6 space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-display font-semibold text-foreground">Manufacturer Form</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <FormField label="Medicine Name" id="name" value={form.name} onChange={update("name")} required disabled={!canSubmit} />
              <FormField label="Batch" id="batch" value={form.batch} onChange={update("batch")} required disabled={!canSubmit} />
              <FormField
                label="Manufacturer Name"
                id="manufacturerName"
                value={form.manufacturerName}
                onChange={update("manufacturerName")}
                required
                disabled={!canSubmit}
              />
              <FormField
                label="Metadata URI"
                id="metadataURI"
                placeholder="ipfs://..."
                value={form.metadataURI}
                onChange={update("metadataURI")}
                disabled={!canSubmit}
              />
              <FormField
                label="MFG Date & Time"
                id="mfgDateTime"
                type="datetime-local"
                value={form.mfgDateTime}
                onChange={update("mfgDateTime")}
                required
                disabled={!canSubmit}
              />
              <FormField
                label="EXP Date & Time"
                id="expDateTime"
                type="datetime-local"
                value={form.expDateTime}
                onChange={update("expDateTime")}
                required
                disabled={!canSubmit}
              />
            </div>

            <div className="border-t border-border pt-5 mt-2">
              <h3 className="text-sm font-semibold text-foreground mb-3">Policy + Origin</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <FormField
                  label="Strips per Box"
                  id="stripsPerBox"
                  type="number"
                  value={form.stripsPerBox}
                  onChange={update("stripsPerBox")}
                  required
                  disabled={!canSubmit}
                />
                <FormField
                  label="Expected Transit Checks"
                  id="expectedTransitChecks"
                  type="number"
                  value={form.expectedTransitChecks}
                  onChange={update("expectedTransitChecks")}
                  required
                  disabled={!canSubmit}
                />
                <FormField
                  label="Strip Tolerance %"
                  id="stripTolerancePct"
                  type="number"
                  value={form.stripTolerancePct}
                  onChange={update("stripTolerancePct")}
                  required
                  disabled={!canSubmit}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <FormField
                  label="Origin Location"
                  id="originLocation"
                  value={form.originLocation}
                  onChange={update("originLocation")}
                  required
                  disabled={!canSubmit}
                />
                <FormField
                  label="Origin Checkpoint Time"
                  id="originCheckpointTime"
                  type="datetime-local"
                  value={form.originCheckpointTime}
                  onChange={update("originCheckpointTime")}
                  required
                  disabled={!canSubmit}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={!canSubmit} className="gradient-primary text-primary-foreground border-0 px-6">
                {busy ? "Submitting..." : "Create on Blockchain"}
              </Button>
              {!canSubmit && !busy && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {!isConnected ? "Login required" : "Wallet check pending"}
                </span>
              )}
            </div>
          </form>

          <div className="space-y-4">
            {error && <ResultPanel type="error" title="Create Failed" message={error} />}
            {contractHint && <ResultPanel type="warning" title="Contract Fallback" message={contractHint} />}
            {medicineId ? (
              <>
                <ResultPanel type="success" title="Medicine Created" message={`medicineId: ${medicineId}`} />
                {usingLocalhostBase && (
                  <ResultPanel
                    type="warning"
                    title="Phone Scan Note"
                    message="This QR uses localhost because no public/LAN verify base URL is configured. For phone scanning, open this app from your laptop's LAN IP before creating the QR."
                  />
                )}
                <QRCodeBox value={qrValue} />
              </>
            ) : (
              <ResultPanel type="empty" title="QR Pending" message="QR code will appear after successful on-chain creation." />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CreatePage;
