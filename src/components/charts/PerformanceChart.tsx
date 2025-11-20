import { Card } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { time: "00:00", responseTime: 120 },
  { time: "04:00", responseTime: 145 },
  { time: "08:00", responseTime: 280 },
  { time: "12:00", responseTime: 350 },
  { time: "16:00", responseTime: 290 },
  { time: "20:00", responseTime: 180 },
];

const PerformanceChart = () => {
  return (
    <Card className="p-6 bg-gradient-card border-border/50 animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-4">Response Time (ms)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorResponseTime" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
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
          <Area 
            type="monotone" 
            dataKey="responseTime" 
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorResponseTime)"
            name="Response Time"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default PerformanceChart;
