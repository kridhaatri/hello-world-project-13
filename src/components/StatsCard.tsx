import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
}

const StatsCard = ({ icon: Icon, label, value, trend, trendUp }: StatsCardProps) => {
  return (
    <Card className="p-4 bg-gradient-card border-border/50 hover:shadow-elegant transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {trend && (
            <p className={`text-xs ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        <div className="p-3 rounded-lg bg-gradient-primary">
          <Icon className="w-5 h-5 text-primary-foreground" />
        </div>
      </div>
    </Card>
  );
};

export default StatsCard;
