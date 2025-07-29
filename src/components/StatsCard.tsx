import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  gradient?: boolean;
  icon?: React.ReactNode;
}

export function StatsCard({ title, value, subtitle, gradient, icon }: StatsCardProps) {
  return (
    <Card className={cn(
      "p-6 border-border/50 transition-all duration-300 hover:shadow-lg",
      gradient 
        ? "bg-gradient-to-br from-primary via-primary-glow to-accent-purple text-primary-foreground hover:shadow-primary/20" 
        : "bg-card hover:border-primary/30"
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className={cn(
            "text-sm font-medium",
            gradient ? "text-primary-foreground/80" : "text-muted-foreground"
          )}>
            {title}
          </p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {subtitle && (
            <p className={cn(
              "text-sm mt-1",
              gradient ? "text-primary-foreground/70" : "text-muted-foreground"
            )}>
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            gradient ? "bg-white/10" : "bg-primary/10"
          )}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}