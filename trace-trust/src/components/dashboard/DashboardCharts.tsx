import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { motion } from "framer-motion";

interface CheckpointOverTime { date: string; count: number }
interface TopLocation { location: string; count: number }
interface VerdictSplit { name: string; value: number }
interface BoxStripLocation { location: string; BOX: number; STRIP: number }

const VERDICT_COLORS: Record<string, string> = {
  LEGIT: "hsl(152, 60%, 42%)",
  REVIEW: "hsl(38, 92%, 50%)",
  SUSPECT: "hsl(0, 72%, 51%)",
};

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
    <h3 className="text-sm font-display font-semibold text-foreground mb-4">{title}</h3>
    {children}
  </motion.div>
);

export const DashboardCharts = ({
  checkpointsOverTime,
  topLocations,
  verdictSplit,
  boxStripByLocation,
}: {
  checkpointsOverTime: CheckpointOverTime[];
  topLocations: TopLocation[];
  verdictSplit: VerdictSplit[];
  boxStripByLocation: BoxStripLocation[];
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <ChartCard title="Checkpoints Over Time">
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={checkpointsOverTime}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
          <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(220,13%,91%)", fontSize: 12 }} />
          <Line type="monotone" dataKey="count" stroke="hsl(172, 66%, 40%)" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>

    <ChartCard title="Top Locations by Checkpoints">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={topLocations} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
          <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
          <YAxis dataKey="location" type="category" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" width={120} />
          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(220,13%,91%)", fontSize: 12 }} />
          <Bar dataKey="count" fill="hsl(190, 70%, 45%)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>

    <ChartCard title="Verdict Split">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={verdictSplit} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" nameKey="name" paddingAngle={3}>
            {verdictSplit.map((entry) => (
              <Cell key={entry.name} fill={VERDICT_COLORS[entry.name] || "#ccc"} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(220,13%,91%)", fontSize: 12 }} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>

    <ChartCard title="BOX vs STRIP by Location">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={boxStripByLocation}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
          <XAxis dataKey="location" tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 46%)" angle={-20} textAnchor="end" height={50} />
          <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(220,13%,91%)", fontSize: 12 }} />
          <Legend />
          <Bar dataKey="BOX" stackId="a" fill="hsl(172, 66%, 40%)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="STRIP" stackId="a" fill="hsl(210, 100%, 52%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  </div>
);
