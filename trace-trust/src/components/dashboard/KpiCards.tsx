import { motion } from "framer-motion";
import { Package, MapPin, Brain, AlertTriangle, Box, Clock } from "lucide-react";
import type { ReactNode } from "react";

interface KpiData {
  totalMedicines: number;
  totalCheckpoints: number;
  avgSuspicion: number;
  suspectCases: number;
  boxStripRatio: string;
  expiringIn30: number;
}

const KpiCard = ({ label, value, icon, accent }: { label: string; value: string | number; icon: ReactNode; accent?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card p-5 flex items-start gap-4"
  >
    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${accent || "bg-primary/10 text-primary"}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
      <p className="text-2xl font-display font-bold text-foreground mt-0.5">{value}</p>
    </div>
  </motion.div>
);

export const KpiCards = ({ data }: { data: KpiData }) => (
  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
    <KpiCard label="Total Medicines" value={data.totalMedicines} icon={<Package className="h-5 w-5" />} />
    <KpiCard label="Total Checkpoints" value={data.totalCheckpoints} icon={<MapPin className="h-5 w-5" />} accent="bg-info/10 text-info" />
    <KpiCard label="Avg Suspicion" value={`${data.avgSuspicion}%`} icon={<Brain className="h-5 w-5" />} accent="bg-warning/10 text-warning" />
    <KpiCard label="Suspect Cases" value={data.suspectCases} icon={<AlertTriangle className="h-5 w-5" />} accent="bg-destructive/10 text-destructive" />
    <KpiCard label="Box:Strip Ratio" value={data.boxStripRatio} icon={<Box className="h-5 w-5" />} accent="bg-accent text-accent-foreground" />
    <KpiCard label="Expiring 30d" value={data.expiringIn30} icon={<Clock className="h-5 w-5" />} accent="bg-warning/10 text-warning" />
  </div>
);
