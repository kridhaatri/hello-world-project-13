import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, MapPin, Calendar, Settings } from "lucide-react";

interface ResourceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  value: string;
  description?: string;
}

const ResourceDetailsModal = ({ isOpen, onClose, title, value, description }: ResourceDetailsModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-card border-border animate-scale-in">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Resource Name */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Resource Name</p>
            <p className="text-xl font-bold text-foreground">{value}</p>
          </div>

          {/* Description */}
          {description && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="text-foreground">{description}</p>
            </div>
          )}

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
              Running
            </Badge>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <p className="text-sm">Region</p>
              </div>
              <p className="text-sm font-medium text-foreground">East US</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <p className="text-sm">Created</p>
              </div>
              <p className="text-sm font-medium text-foreground">Dec 2024</p>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="p-4 rounded-lg bg-gradient-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-5 h-5 text-primary" />
              <p className="font-semibold text-foreground">Performance Metrics</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">99.9%</p>
                <p className="text-xs text-muted-foreground">Uptime</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent">45ms</p>
                <p className="text-xs text-muted-foreground">Latency</p>
              </div>
              <div>
                <p className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">4.8/5</p>
                <p className="text-xs text-muted-foreground">Health</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResourceDetailsModal;
