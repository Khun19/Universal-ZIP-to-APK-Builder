import type { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  accent?: 'primary' | 'emerald' | 'amber' | 'rose' | 'teal';
  onClick?: () => void;
  className?: string;
}

export function DashboardCard({
  label,
  value,
  subtext,
  icon: Icon,
  accent = 'primary',
  onClick,
  className = '',
}: DashboardCardProps) {
  const accentStyles = {
    primary: 'text-primary border-primary/20 bg-primary/10',
    emerald: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10',
    amber: 'text-amber-500 border-amber-500/20 bg-amber-500/10',
    rose: 'text-rose-500 border-rose-500/20 bg-rose-500/10',
    teal: 'text-teal-500 border-teal-500/20 bg-teal-500/10',
  }[accent];

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:border-border/80 hover:shadow-md ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      data-testid={`dashboard-card-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono-ui text-[11px] uppercase tracking-[.18em] text-muted-foreground">
          {label}
        </span>
        <div className={`rounded-xl border p-2.5 transition-colors ${accentStyles}`}>
          <Icon size={18} />
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-display text-3xl font-bold tracking-tight text-foreground">
          {value}
        </span>
      </div>

      {subtext && (
        <p className="mt-1.5 text-xs text-muted-foreground font-sans">
          {subtext}
        </p>
      )}

      {/* Subtle topographic contour accent line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-border to-transparent opacity-60 group-hover:via-primary/50 transition-colors" />
    </div>
  );
}
