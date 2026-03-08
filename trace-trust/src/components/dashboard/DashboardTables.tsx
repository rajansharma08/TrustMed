import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusPill } from "@/components/StatusPill";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Search, ArrowUpDown } from "lucide-react";
import type { Medicine, DashboardCheckpoint, FlaggedCase } from "@/utils/dashboard";

// -- Medicines Table --

export const MedicinesTable = ({ data }: { data: Medicine[] }) => {
  const [search, setSearch] = useState("");
  const [verdictFilter, setVerdictFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<"suspicion" | "name">("suspicion");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    let d = data;
    if (search) d = d.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.medicineId.toLowerCase().includes(search.toLowerCase()));
    if (verdictFilter !== "all") d = d.filter((m) => m.verdict === verdictFilter);
    return [...d].sort((a, b) => sortDir === "asc" ? (a[sortKey] > b[sortKey] ? 1 : -1) : (a[sortKey] < b[sortKey] ? 1 : -1));
  }, [data, search, verdictFilter, sortKey, sortDir]);

  const toggleSort = (key: "suspicion" | "name") => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const verdictVariant = (v: string) => v === "LEGIT" ? "legit" as const : v === "REVIEW" ? "review" as const : "suspect" as const;

  return (
    <TableCard title="Recent Medicines" count={filtered.length}>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name or ID…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <Select value={verdictFilter} onValueChange={setVerdictFilter}>
          <SelectTrigger className="w-full sm:w-36 h-9"><SelectValue placeholder="Verdict" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Verdicts</SelectItem>
            <SelectItem value="LEGIT">LEGIT</SelectItem>
            <SelectItem value="REVIEW">REVIEW</SelectItem>
            <SelectItem value="SUSPECT">SUSPECT</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medicine ID</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("name")}>
                <span className="flex items-center gap-1">Name <ArrowUpDown className="h-3 w-3" /></span>
              </TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead>Verdict</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("suspicion")}>
                <span className="flex items-center gap-1">Suspicion <ArrowUpDown className="h-3 w-3" /></span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.slice(0, 10).map((m) => (
              <TableRow key={m.medicineId}>
                <TableCell className="font-mono text-xs">{m.medicineId}</TableCell>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell className="text-xs">{m.batch}</TableCell>
                <TableCell className="text-xs">{m.manufacturer}</TableCell>
                <TableCell><StatusPill variant={verdictVariant(m.verdict)} dot={false}>{m.verdict}</StatusPill></TableCell>
                <TableCell>
                  <span className={`font-semibold text-sm ${m.suspicion > 50 ? "text-destructive" : m.suspicion > 20 ? "text-warning" : "text-success"}`}>{m.suspicion}%</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">No medicines found.</p>}
      </div>
    </TableCard>
  );
};

// -- Checkpoints Table --

export const CheckpointsTable = ({ data }: { data: DashboardCheckpoint[] }) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  const locations = useMemo(() => [...new Set(data.map((c) => c.location))], [data]);

  const filtered = useMemo(() => {
    let d = data;
    if (search) d = d.filter((c) => c.medicineId.toLowerCase().includes(search.toLowerCase()) || c.location.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== "all") d = d.filter((c) => c.status === statusFilter);
    if (locationFilter !== "all") d = d.filter((c) => c.location === locationFilter);
    return d;
  }, [data, search, statusFilter, locationFilter]);

  const statusVariant = (s: string) => {
    const l = s.toLowerCase();
    if (l === "created") return "created" as const;
    if (l.includes("transit") || l === "checkpoint") return "in-transit" as const;
    if (l === "delivered") return "delivered" as const;
    return "default" as const;
  };

  return (
    <TableCard title="Recent Checkpoints" count={filtered.length}>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search ID or location…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Created">Created</SelectItem>
            <SelectItem value="In Transit">In Transit</SelectItem>
            <SelectItem value="Checkpoint">Checkpoint</SelectItem>
            <SelectItem value="Delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-full sm:w-44 h-9"><SelectValue placeholder="Location" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map((loc) => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Medicine ID</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scan Mode</TableHead>
              <TableHead>Units</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.slice(0, 10).map((c) => (
              <TableRow key={`${c.medicineId}-${c.id}`}>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{c.eventTimestamp}</TableCell>
                <TableCell className="font-mono text-xs">{c.medicineId}</TableCell>
                <TableCell className="text-xs">{c.location}</TableCell>
                <TableCell><StatusPill variant={statusVariant(c.status)} dot={false}>{c.status}</StatusPill></TableCell>
                <TableCell><span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${c.scanMode === "BOX" ? "bg-primary/10 text-primary" : "bg-info/10 text-info"}`}>{c.scanMode}</span></TableCell>
                <TableCell className="font-medium">{c.scannedUnits}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">No checkpoints found.</p>}
      </div>
    </TableCard>
  );
};

// -- Flagged Cases Table --

export const FlaggedCasesTable = ({ data }: { data: FlaggedCase[] }) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return data;
    return data.filter((c) => c.medicineId.toLowerCase().includes(search.toLowerCase()));
  }, [data, search]);

  return (
    <TableCard title="Flagged Cases" count={filtered.length}>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search medicine ID…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medicine ID</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead>Suspicion</TableHead>
              <TableHead>Recommendation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.slice(0, 10).map((c) => (
              <TableRow key={c.medicineId}>
                <TableCell className="font-mono text-xs">{c.medicineId}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {c.flags.map((f) => (
                      <span key={f} className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">{f}</span>
                    ))}
                  </div>
                </TableCell>
                <TableCell><span className="font-semibold text-destructive">{c.suspicion}%</span></TableCell>
                <TableCell className="text-xs font-medium">{c.recommendation}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">No flagged cases.</p>}
      </div>
    </TableCard>
  );
};

// -- Shared wrapper --

const TableCard = ({ title, count, children }: { title: string; count: number; children: React.ReactNode }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-display font-semibold text-foreground">{title}</h3>
      <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{count} results</span>
    </div>
    {children}
  </motion.div>
);
