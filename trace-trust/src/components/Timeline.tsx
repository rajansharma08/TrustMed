import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { StatusPill } from "./StatusPill";
import { MapPin, Clock, User, Package, StickyNote } from "lucide-react";

export interface Checkpoint {
  id: number;
  status: string;
  location: string;
  actor: string;
  eventTimestamp: string;
  reportedTime: string;
  scanMode: string;
  scannedUnits: number;
  notes: string;
}

interface MedicineInfo {
  name: string;
  batch: string;
  manufacturer: string;
  creator: string;
  mfgDate: string;
  expDate: string;
  metadataUri: string;
}

interface TimelineProps {
  medicine: MedicineInfo;
  checkpoints: Checkpoint[];
  className?: string;
}

const statusVariant = (s: string) => {
  const lower = s.toLowerCase();
  if (lower === "created") return "created" as const;
  if (lower.includes("transit") || lower.includes("checkpoint")) return "in-transit" as const;
  if (lower === "delivered") return "delivered" as const;
  return "default" as const;
};

export const Timeline = ({ medicine, checkpoints, className }: TimelineProps) => (
  <div className={cn("space-y-6", className)}>
    <div className="glass-card p-6 space-y-3">
      <h3 className="text-lg font-display font-bold text-foreground">Medicine Details</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Detail label="Name" value={medicine.name} />
        <Detail label="Batch" value={medicine.batch} />
        <Detail label="Manufacturer" value={medicine.manufacturer} />
        <Detail label="Creator" value={medicine.creator} />
        <Detail label="MFG Date" value={medicine.mfgDate} />
        <Detail label="EXP Date" value={medicine.expDate} />
        <Detail label="Metadata" value={medicine.metadataUri} className="col-span-2" />
      </div>
    </div>

    <div className="glass-card p-6">
      <h3 className="text-lg font-display font-bold text-foreground mb-4">Supply Chain Timeline</h3>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
        <div className="space-y-6">
          {checkpoints.map((cp, i) => (
            <motion.div
              key={cp.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative pl-10"
            >
              <div className="absolute left-2.5 top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-accent" />
              <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <StatusPill variant={statusVariant(cp.status)}>{cp.status}</StatusPill>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {cp.eventTimestamp}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{cp.location}</span>
                  <span className="flex items-center gap-1"><User className="h-3 w-3" />{cp.actor}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Reported: {cp.reportedTime}</span>
                  <span className="flex items-center gap-1"><Package className="h-3 w-3" />{cp.scanMode} · {cp.scannedUnits} units</span>
                </div>
                {cp.notes && (
                  <p className="text-xs text-muted-foreground flex items-start gap-1">
                    <StickyNote className="h-3 w-3 mt-0.5 shrink-0" />
                    {cp.notes}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const Detail = ({ label, value, className }: { label: string; value: string; className?: string }) => (
  <div className={cn("space-y-0.5", className)}>
    <span className="text-muted-foreground text-xs">{label}</span>
    <p className="font-medium text-foreground truncate">{value}</p>
  </div>
);
