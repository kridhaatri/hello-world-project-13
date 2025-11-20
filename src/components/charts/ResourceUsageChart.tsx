import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const data = [
  { time: "00:00", cpu: 45, memory: 62, disk: 35 },
  { time: "04:00", cpu: 52, memory: 65, disk: 38 },
  { time: "08:00", cpu: 78, memory: 72, disk: 42 },
  { time: "12:00", cpu: 85, memory: 80, disk: 45 },
  { time: "16:00", cpu: 72, memory: 75, disk: 48 },
  { time: "20:00", cpu: 60, memory: 68, disk: 43 },
];

const ResourceUsageChart = () => {
  return (
    <Card className="p-6 bg-gradient-card border-border/50 animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-4">Resource Usage (24h)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="time" 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="cpu" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            name="CPU %"
          />
          <Line 
            type="monotone" 
            dataKey="memory" 
            stroke="hsl(var(--accent))" 
            strokeWidth={2}
            name="Memory %"
          />
          <Line 
            type="monotone" 
            dataKey="disk" 
            stroke="hsl(var(--primary-glow))" 
            strokeWidth={2}
            name="Disk %"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default ResourceUsageChart;
