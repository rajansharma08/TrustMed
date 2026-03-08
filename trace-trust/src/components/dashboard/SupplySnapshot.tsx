import { motion } from "framer-motion";
import { CheckCircle2, Clock3, PackageCheck, PackageOpen, ShieldAlert, ShieldCheck, Truck } from "lucide-react";
import type { DashboardCheckpoint, SupplySnapshot as SupplySnapshotType } from "@/utils/dashboard";

const StatCard = ({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: string;
}) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-2xl font-display font-bold text-foreground mt-1">{value}</p>
      </div>
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${tone}`}>{icon}</div>
    </div>
  </motion.div>
);

export const SupplySnapshot = ({
  snapshot,
  recentTransit,
}: {
  snapshot: SupplySnapshotType;
  recentTransit: DashboardCheckpoint[];
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      <StatCard
        label="Legit Medicines"
        value={snapshot.legit}
        icon={<ShieldCheck className="h-5 w-5" />}
        tone="bg-success/10 text-success"
      />
      <StatCard
        label="Review Queue"
        value={snapshot.review}
        icon={<Clock3 className="h-5 w-5" />}
        tone="bg-warning/10 text-warning"
      />
      <StatCard
        label="Suspect Cases"
        value={snapshot.suspect}
        icon={<ShieldAlert className="h-5 w-5" />}
        tone="bg-destructive/10 text-destructive"
      />
      <StatCard
        label="In Transit"
        value={snapshot.inTransit}
        icon={<Truck className="h-5 w-5" />}
        tone="bg-info/10 text-info"
      />
      <StatCard
        label="Delivered"
        value={snapshot.delivered}
        icon={<PackageCheck className="h-5 w-5" />}
        tone="bg-primary/10 text-primary"
      />
      <StatCard
        label="Created"
        value={snapshot.created}
        icon={<PackageOpen className="h-5 w-5" />}
        tone="bg-accent text-accent-foreground"
      />
      <StatCard
        label="Transit Events"
        value={snapshot.transitEvents}
        icon={<CheckCircle2 className="h-5 w-5" />}
        tone="bg-secondary text-secondary-foreground"
      />
    </div>

    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-display font-semibold text-foreground">Recent Supply Transits</h3>
        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
          {recentTransit.length} events
        </span>
      </div>
      <div className="space-y-2">
        {recentTransit.map((cp) => (
          <div key={`${cp.medicineId}-${cp.id}`} className="rounded-lg border border-border/60 bg-background/60 px-3 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono text-foreground">{cp.medicineId}</span>
              <span className="text-xs text-muted-foreground">{cp.eventTimestamp}</span>
            </div>
            <p className="text-sm text-foreground mt-1">
              {cp.status} at {cp.location}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Mode: {cp.scanMode} | Units: {cp.scannedUnits}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  </div>
);
