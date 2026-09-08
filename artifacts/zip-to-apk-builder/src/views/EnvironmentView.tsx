import { useState } from 'react';
import { Server, RefreshCw, Cpu, ShieldCheck } from 'lucide-react';
import { EnvironmentCard } from '@/components/EnvironmentCard';

export function EnvironmentView() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1200);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8" data-testid="environment-view">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 font-mono-ui text-[11px] uppercase tracking-[.2em] text-primary font-semibold mb-1">
          <span>Diagnostics & Toolchain</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
          Build Environment
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Verified Android platform SDKs, Java compilers, Gradle build engines, and packaging utilities.
        </p>
      </div>

      {/* Main Environment Diagnostics */}
      <EnvironmentCard
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
    </div>
  );
}
