import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { SupplySnapshot } from "@/components/dashboard/SupplySnapshot";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { MedicinesTable, CheckpointsTable, FlaggedCasesTable } from "@/components/dashboard/DashboardTables";
import { ResultPanel } from "@/components/ResultPanel";
import {
  loadDashboardData,
  getKpis, getCheckpointsOverTime, getTopLocations, getVerdictSplit, getBoxStripByLocation, getFlaggedCases, getSupplySnapshot, getRecentTransitFeed,
  type Medicine, type DashboardCheckpoint,
} from "@/utils/dashboard";
import { LayoutDashboard } from "lucide-react";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [checkpoints, setCheckpoints] = useState<DashboardCheckpoint[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await loadDashboardData();
        if (!mounted) return;
        setMedicines(data.medicines);
        setCheckpoints(data.checkpoints);
      } catch (e: any) {
        if (!mounted) return;
        setError(String(e?.shortMessage || e?.message || e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const kpis = useMemo(() => getKpis(medicines, checkpoints), [medicines, checkpoints]);
  const cpOverTime = useMemo(() => getCheckpointsOverTime(checkpoints), [checkpoints]);
  const topLocs = useMemo(() => getTopLocations(checkpoints), [checkpoints]);
  const verdicts = useMemo(() => getVerdictSplit(medicines), [medicines]);
  const boxStrip = useMemo(() => getBoxStripByLocation(checkpoints), [checkpoints]);
  const flagged = useMemo(() => getFlaggedCases(medicines), [medicines]);
  const supplySnapshot = useMemo(() => getSupplySnapshot(medicines, checkpoints), [medicines, checkpoints]);
  const recentTransit = useMemo(() => getRecentTransitFeed(checkpoints, 8), [checkpoints]);

  if (loading) return (
    <div className="container mx-auto px-4 py-12">
      <ResultPanel type="loading" title="Loading Dashboard" message="Fetching on-chain data and running analytics…" />
    </div>
  );

  if (error) return (
    <div className="container mx-auto px-4 py-12">
      <ResultPanel type="error" title="Dashboard Error" message={error} />
    </div>
  );

  if (!medicines.length) return (
    <div className="container mx-auto px-4 py-12">
      <ResultPanel type="empty" title="No Data" message="No medicines or checkpoints found on-chain yet." />
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
          <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time supply chain analytics and medicine traceability overview.</p>
        </div>
      </motion.div>

      <KpiCards data={kpis} />
      <SupplySnapshot snapshot={supplySnapshot} recentTransit={recentTransit} />
      <DashboardCharts checkpointsOverTime={cpOverTime} topLocations={topLocs} verdictSplit={verdicts} boxStripByLocation={boxStrip} />
      <MedicinesTable data={medicines} />
      <CheckpointsTable data={checkpoints} />
      <FlaggedCasesTable data={flagged} />
    </div>
  );
};

export default Dashboard;
