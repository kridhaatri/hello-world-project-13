import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface InfoCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  description?: string;
  onClick?: () => void;
}

const InfoCard = ({ icon: Icon, title, value, description, onClick }: InfoCardProps) => {
  return (
    <Card 
      className="group relative overflow-hidden border-border/50 bg-gradient-card backdrop-blur-sm transition-all duration-300 hover:shadow-elegant hover:scale-105 animate-fade-in cursor-pointer active:scale-95"
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
      
      <div className="relative p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-gradient-primary group-hover:animate-glow transition-transform group-hover:rotate-6">
            <Icon className="w-6 h-6 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
        
        <div className="space-y-2">
          <p className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {value}
          </p>
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground/70 group-hover:text-primary transition-colors">
          Click to view details →
        </p>
      </div>
    </Card>
  );
};

export default InfoCard;
