import { useId } from 'react';
import { Compass, Radio, MapPin, CheckCircle2, AlertOctagon, Layers } from 'lucide-react';
import type { BuildStatus } from '@/context/BuildContext';

export interface BuilderTerrainProps {
  status?: BuildStatus | 'INSPECTING' | 'BUILDING' | 'COMPLETE' | 'STOPPED' | 'IDLE' | 'ANALYZING' | 'SUCCESS' | 'FAILED';
  state?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  titleOverride?: string;
  centerTitle?: string;
  subtitleOverride?: string;
  centerSubtitle?: string;
  className?: string;
}

export function BuilderTerrain({
  status,
  state,
  size = 'hero',
  titleOverride,
  centerTitle,
  subtitleOverride,
  centerSubtitle,
  className = '',
}: BuilderTerrainProps) {
  const gradientId = useId();
  const effectiveStatus = state || status || 'INSPECTING';

  // Normalize status label and aesthetic
  const normalizedStatus =
    effectiveStatus === 'SUCCESS' || effectiveStatus === 'COMPLETE'
      ? 'COMPLETE'
      : effectiveStatus === 'FAILED' || effectiveStatus === 'STOPPED'
      ? 'STOPPED'
      : effectiveStatus === 'BUILDING'
      ? 'BUILDING'
      : effectiveStatus === 'INSPECTING' || effectiveStatus === 'ANALYZED' || effectiveStatus === 'ANALYZING'
      ? 'INSPECTING'
      : 'IDLE';

  const title =
    centerTitle ||
    titleOverride ||
    (normalizedStatus === 'INSPECTING'
      ? 'ANALYZING'
      : normalizedStatus === 'BUILDING'
      ? 'BUILDING'
      : normalizedStatus === 'COMPLETE'
      ? 'READY'
      : normalizedStatus === 'STOPPED'
      ? 'FAILED'
      : 'STANDBY');

  const subtitle =
    centerSubtitle ||
    subtitleOverride ||
    (normalizedStatus === 'INSPECTING'
      ? 'Inspecting project structure & toolchain'
      : normalizedStatus === 'BUILDING'
      ? 'Compiling Gradle bytecode'
      : normalizedStatus === 'COMPLETE'
      ? 'Artifact verified & signed'
      : normalizedStatus === 'STOPPED'
      ? 'Execution halted'
      : 'Awaiting archive upload');

  const dimensions =
    size === 'sm'
      ? 'w-64 h-64'
      : size === 'md'
      ? 'w-80 h-80'
      : size === 'lg'
      ? 'w-96 h-96'
      : 'w-full max-w-[540px] aspect-square';

  // Status accents
  const isInspecting = normalizedStatus === 'INSPECTING';
  const isBuilding = normalizedStatus === 'BUILDING';
  const isComplete = normalizedStatus === 'COMPLETE';
  const isStopped = normalizedStatus === 'STOPPED';

  const strokeAccent = isComplete
    ? 'text-emerald-500'
    : isStopped
    ? 'text-rose-500'
    : isBuilding
    ? 'text-amber-400'
    : 'text-teal-400';

  const ringGlow = isComplete
    ? 'border-emerald-500/40 bg-emerald-950/25 shadow-emerald-500/15'
    : isStopped
    ? 'border-rose-500/40 bg-rose-950/25 shadow-rose-500/15'
    : isBuilding
    ? 'border-amber-400/40 bg-amber-950/20 shadow-amber-500/15'
    : 'border-teal-500/40 bg-teal-950/20 shadow-teal-500/15';

  return (
    <div
      className={`relative mx-auto flex items-center justify-center select-none overflow-hidden rounded-3xl border border-border/70 bg-card/60 p-4 backdrop-blur-md shadow-xl ${dimensions} ${className}`}
      data-testid="builder-terrain-container"
    >
      {/* Topographic Background Pattern SVG */}
      <svg
        className="absolute inset-0 h-full w-full pointer-events-none"
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={`glow-${gradientId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.16" />
            <stop offset="60%" stopColor="currentColor" stopOpacity="0.04" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`sweep-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Ambient Center Glow */}
        <circle cx="250" cy="250" r="230" fill={`url(#glow-${gradientId})`} className={strokeAccent} />

        {/* Topographic Coordinate Grid Lines */}
        <g stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 4" className="text-muted-foreground/20">
          <line x1="50" y1="0" x2="50" y2="500" />
          <line x1="150" y1="0" x2="150" y2="500" />
          <line x1="250" y1="0" x2="250" y2="500" />
          <line x1="350" y1="0" x2="350" y2="500" />
          <line x1="450" y1="0" x2="450" y2="500" />

          <line x1="0" y1="50" x2="500" y2="50" />
          <line x1="0" y1="150" x2="500" y2="150" />
          <line x1="0" y1="250" x2="500" y2="250" />
          <line x1="0" y1="350" x2="500" y2="350" />
          <line x1="0" y1="450" x2="500" y2="450" />
        </g>

        {/* Concentric Elevation Contour Rings */}
        <g stroke="currentColor" strokeWidth="1" className="text-muted-foreground/25">
          <circle cx="250" cy="250" r="225" strokeDasharray="2 6" />
          <circle cx="250" cy="250" r="190" strokeWidth="0.75" />
          <circle cx="250" cy="250" r="150" strokeDasharray="4 4" strokeWidth="1.2" className="opacity-60" />
          <circle cx="250" cy="250" r="110" strokeWidth="0.75" />
          <circle cx="250" cy="250" r="80" strokeDasharray="1 3" />
        </g>

        {/* Organic Contour Isolines (Simulating Elevation Ridges) */}
        <path
          d="M 30 220 Q 90 140 180 180 T 320 150 T 460 210"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          className="text-muted-foreground/30"
        />
        <path
          d="M 40 310 Q 120 380 220 330 T 360 370 T 470 290"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          className="text-muted-foreground/30"
        />
        <path
          d="M 90 90 Q 200 40 310 80 T 420 110"
          stroke="currentColor"
          strokeWidth="0.75"
          fill="none"
          className="text-muted-foreground/20"
        />
        <path
          d="M 80 410 Q 210 460 340 430 T 430 390"
          stroke="currentColor"
          strokeWidth="0.75"
          fill="none"
          className="text-muted-foreground/20"
        />

        {/* Dynamic Route Path (Trail Motif Connecting Nodes) */}
        <path
          d="M 70 360 L 140 280 L 220 290 L 280 200 L 360 220 L 430 140"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray={isComplete ? 'none' : '4 4'}
          fill="none"
          className={`${strokeAccent} opacity-75`}
        />

        {/* Waypoint Nodes Along the Route */}
        <g className={strokeAccent}>
          <circle cx="70" cy="360" r="4" fill="currentColor" />
          <circle cx="140" cy="280" r="3.5" fill="currentColor" opacity="0.8" />
          <circle cx="220" cy="290" r="3.5" fill="currentColor" opacity="0.8" />
          <circle cx="280" cy="200" r="3.5" fill="currentColor" opacity="0.9" />
          <circle cx="360" cy="220" r="4" fill="currentColor" opacity="0.8" />
          <circle cx="430" cy="140" r="5" fill="currentColor" />

          {/* Pulsing Target Halo on Last Node */}
          {(isInspecting || isBuilding) && (
            <circle
              cx="430"
              cy="140"
              r="10"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              className="animate-ping opacity-60"
            />
          )}
        </g>

        {/* Rotating Radar / Scanning Beam (When Inspecting or Building) */}
        {(isInspecting || isBuilding) && (
          <g className="origin-center animate-[spin_8s_linear_infinite]">
            <line
              x1="250"
              y1="250"
              x2="480"
              y2="250"
              stroke="currentColor"
              strokeWidth="1.5"
              className={strokeAccent}
              opacity="0.65"
            />
            {/* Radar Sector Gradient */}
            <path
              d="M 250 250 L 470 210 A 225 225 0 0 1 480 250 Z"
              fill={`url(#sweep-${gradientId})`}
              className={strokeAccent}
            />
          </g>
        )}

        {/* Topographic Elevation Markers & Ticks */}
        <g className="text-muted-foreground/50 font-mono text-[8px]" fill="currentColor">
          <text x="56" y="246">200m</text>
          <text x="156" y="246">400m</text>
          <text x="356" y="246">600m</text>
          <text x="456" y="246">800m</text>

          <text x="254" y="60">N 45°20′</text>
          <text x="254" y="445">S 12°04′</text>
        </g>
      </svg>

      {/* Compass / Orientation Indicator Top-Right */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-2.5 py-1 font-mono-ui text-[10px] tracking-wider text-muted-foreground backdrop-blur">
        <Compass size={12} className={isBuilding ? 'animate-spin' : ''} />
        <span>CONTOUR 10M</span>
      </div>

      {/* Elevation Metadata Top-Left */}
      <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-2.5 py-1 font-mono-ui text-[10px] tracking-wider text-muted-foreground backdrop-blur">
        <Layers size={11} className={strokeAccent} />
        <span className="uppercase">{normalizedStatus} SECTOR</span>
      </div>

      {/* Signature Center Core Display */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Outer Kinetic Ring */}
        <div
          className={`relative flex h-36 w-36 items-center justify-center rounded-full border-2 shadow-2xl backdrop-blur-md transition-all duration-700 ${ringGlow}`}
        >
          {/* Subtle spinning dashed orbit */}
          <div
            className={`absolute inset-[-6px] rounded-full border border-dashed border-current opacity-40 ${
              isInspecting || isBuilding ? 'animate-[spin_18s_linear_infinite]' : ''
            } ${strokeAccent}`}
          />

          {/* Internal status icon & badge */}
          <div className="flex flex-col items-center">
            {isComplete ? (
              <div className="rounded-full bg-emerald-500/20 p-2.5 text-emerald-400">
                <CheckCircle2 size={32} />
              </div>
            ) : isStopped ? (
              <div className="rounded-full bg-rose-500/20 p-2.5 text-rose-400">
                <AlertOctagon size={32} />
              </div>
            ) : isBuilding ? (
              <div className="rounded-full bg-amber-400/20 p-2.5 text-amber-400">
                <Radio size={30} className="animate-pulse" />
              </div>
            ) : (
              <div className="rounded-full bg-teal-400/20 p-2.5 text-teal-400">
                <Radio size={30} className="animate-pulse" />
              </div>
            )}

            <div className="mt-1 font-mono-ui text-[11px] font-bold tracking-[.25em] text-foreground">
              {title}
            </div>
          </div>
        </div>

        {/* Subtitle / Phase Context */}
        <p className="mt-4 max-w-[280px] font-sans text-xs font-medium leading-relaxed text-muted-foreground">
          {subtitle}
        </p>

        {/* Coordinates readout below */}
        <div className="mt-2 flex items-center gap-2 font-mono-ui text-[9px] uppercase tracking-widest text-muted-foreground/60">
          <MapPin size={10} className={strokeAccent} />
          <span>ROUTE: APK-TARGET // GRID-V4</span>
        </div>
      </div>
    </div>
  );
}
