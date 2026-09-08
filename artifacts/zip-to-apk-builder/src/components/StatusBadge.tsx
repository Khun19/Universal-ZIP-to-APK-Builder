import { CheckCircle2, CircleDot, AlertTriangle, XCircle, Clock } from 'lucide-react';
import type { BuildStatus } from '@/context/BuildContext';

interface StatusBadgeProps {
  status: BuildStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function StatusBadge({ status, size = 'md', showIcon = true }: StatusBadgeProps) {
  const norm = (status || '').toUpperCase();

  let colorClasses = 'border-border bg-muted/50 text-muted-foreground';
  let Icon = Clock;

  if (norm === 'SUCCESS' || norm === 'COMPLETE' || norm === 'READY') {
    colorClasses = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    Icon = CheckCircle2;
  } else if (norm === 'BUILDING' || norm === 'RUNNING' || norm === 'ACTIVE') {
    colorClasses = 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400';
    Icon = CircleDot;
  } else if (norm === 'INSPECTING' || norm === 'ANALYZING' || norm === 'PREPARING') {
    colorClasses = 'border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400';
    Icon = CircleDot;
  } else if (norm === 'FAILED' || norm === 'ERROR' || norm === 'STOPPED') {
    colorClasses = 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400';
    Icon = XCircle;
  } else if (norm === 'WARNING') {
    colorClasses = 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400';
    Icon = AlertTriangle;
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px] gap-1'
      : size === 'lg'
      ? 'px-3.5 py-1.5 text-xs gap-2'
      : 'px-2.5 py-1 text-[11px] gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-mono-ui font-medium rounded-full border tracking-wide uppercase transition-colors ${sizeClasses} ${colorClasses}`}
      data-testid={`badge-status-${norm.toLowerCase()}`}
    >
      {showIcon && (
        <Icon
          size={size === 'sm' ? 10 : size === 'lg' ? 14 : 12}
          className={norm === 'BUILDING' || norm === 'INSPECTING' ? 'animate-spin' : ''}
        />
      )}
      <span>{norm}</span>
    </span>
  );
}
