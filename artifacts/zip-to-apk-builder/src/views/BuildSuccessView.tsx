import { useRoute, Link, useLocation } from 'wouter';
import { CheckCircle2, ArrowLeft, Terminal, RotateCcw, Share2, Sparkles } from 'lucide-react';
import { useBuild } from '@/context/BuildContext';
import { BuilderTerrain } from '@/components/BuilderTerrain';
import { ArtifactCard } from '@/components/ArtifactCard';

export function BuildSuccessView() {
  const [, params] = useRoute('/build/:id/success');
  const [, setLocation] = useLocation();
  const { builds, retryBuild } = useBuild();

  const buildId = params?.id;
  const build = builds.find((b) => b.id === buildId) || builds[0];

  if (!build || !build.artifact) {
    return (
      <div className="py-20 text-center">
        <h3 className="text-lg font-bold">No Validated Artifact Found</h3>
        <Link href="/dashboard" className="text-primary underline mt-2 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const handleBuildAgain = () => {
    setLocation(`/build/${build.id}`);
  };

  const handleViewLogs = () => {
    setLocation(`/build/${build.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8" data-testid="build-success-view">
      {/* Top breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          href={`/build/${build.id}`}
          className="inline-flex items-center gap-1.5 font-mono-ui text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={13} />
          <span>Back to Build Console</span>
        </Link>

        <span className="font-mono-ui text-xs text-emerald-500 font-semibold">
          PASSED VALIDATION GATE
        </span>
      </div>

      {/* Completion Header & Signature Terrain */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 font-mono-ui text-xs font-bold text-emerald-500">
          <Sparkles size={13} />
          <span>ASSEMBLE DEBUG COMPLETED</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          APK Build Successful
        </h1>

        <p className="max-w-md text-sm sm:text-base text-muted-foreground">
          Your Android APK is ready for device sideloading, emulator testing, or distribution.
        </p>

        {/* BuilderTerrain in COMPLETE mode */}
        <div className="pt-2">
          <BuilderTerrain
            status="COMPLETE"
            size="md"
            titleOverride="COMPLETE"
            subtitleOverride="Package sealed with debug signature"
          />
        </div>
      </div>

      {/* Artifact Card with Download & SHA-256 */}
      <ArtifactCard
        artifact={build.artifact}
        onViewLogs={handleViewLogs}
        onBuildAgain={handleBuildAgain}
      />
    </div>
  );
}
