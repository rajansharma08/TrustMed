import type { Checkpoint, Medicine } from "@/types";
import type { Checkpoint as TimelineCheckpoint } from "@/components/Timeline";
import { fromUnixSeconds, shortAddr } from "@/utils";

function parseCheckpointNotes(notes: string) {
  const reportedAtMatch = /\[reportedAt=([^\]]+)\]/i.exec(notes || "");
  const scanModeMatch = /\[scanMode=(BOX|STRIP)\]/i.exec(notes || "");
  const scannedUnitsMatch = /\[scannedUnits=(\d+)\]/i.exec(notes || "");
  const cleanNotes = (notes || "")
    .replace(/\[reportedAt=[^\]]+\]/gi, "")
    .replace(/\[scanMode=[^\]]+\]/gi, "")
    .replace(/\[scannedUnits=[^\]]+\]/gi, "")
    .trim();

  return {
    reportedAt: reportedAtMatch?.[1] || "",
    scanMode: scanModeMatch?.[1] || "BOX",
    scannedUnits: scannedUnitsMatch?.[1] || "1",
    cleanNotes,
  };
}

export function toTimelineMedicine(medicine: Medicine) {
  return {
    name: medicine.name,
    batch: medicine.batch,
    manufacturer: medicine.manufacturerName,
    creator: shortAddr(medicine.creator),
    mfgDate: fromUnixSeconds(medicine.mfgDate),
    expDate: fromUnixSeconds(medicine.expDate),
    metadataUri: medicine.metadataURI || "(none)",
  };
}

export function toTimelineCheckpoints(checkpoints: Checkpoint[]): TimelineCheckpoint[] {
  return checkpoints.map((cp, index) => {
    const parsed = parseCheckpointNotes(cp.notes || "");
    const ts = Number(cp.timestamp) * 1000;
    const chainTimestamp = Number.isFinite(ts) ? new Date(ts).toLocaleString() : String(cp.timestamp);
    const eventTimestamp = parsed.reportedAt || chainTimestamp;

    return {
      id: index + 1,
      status: cp.status || "Checkpoint",
      location: cp.location || "(not provided)",
      actor: shortAddr(cp.actor),
      eventTimestamp,
      reportedTime: parsed.reportedAt || chainTimestamp,
      scanMode: parsed.scanMode,
      scannedUnits: Math.max(1, Number(parsed.scannedUnits) || 1),
      notes: parsed.cleanNotes,
    };
  });
}
