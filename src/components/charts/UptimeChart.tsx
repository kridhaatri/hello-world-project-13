import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const data = [
  { day: "Mon", uptime: 99.9, downtime: 0.1 },
  { day: "Tue", uptime: 100, downtime: 0 },
  { day: "Wed", uptime: 99.5, downtime: 0.5 },
  { day: "Thu", uptime: 100, downtime: 0 },
  { day: "Fri", uptime: 99.8, downtime: 0.2 },
  { day: "Sat", uptime: 100, downtime: 0 },
  { day: "Sun", uptime: 99.9, downtime: 0.1 },
];

const UptimeChart = () => {
  return (
    <Card className="p-6 bg-gradient-card border-border/50 animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-4">Weekly Uptime</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="day" 
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
          <Bar 
            dataKey="uptime" 
            fill="hsl(var(--primary))" 
            radius={[8, 8, 0, 0]}
            name="Uptime %"
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 flex items-center justify-center gap-2">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <p className="text-sm text-muted-foreground">Average Uptime: 99.87%</p>
      </div>
    </Card>
  );
};

export default UptimeChart;
