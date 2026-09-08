import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';

export type BuildStatus = 'IDLE' | 'INSPECTING' | 'ANALYZED' | 'BUILDING' | 'SUCCESS' | 'FAILED';

export type ProjectType = 'Native Android' | 'Capacitor' | 'React / Vite' | 'Web Project' | 'Unknown';

export interface ProjectAnalysis {
  projectType: ProjectType;
  confidence: 'High' | 'Medium' | 'Low' | number;
  strategy: string;
  compatibilityScore: number;
  framework: string;
  buildTool: string;
  language: string;
  packageManager: string;
  minSdk?: number;
  targetSdk?: number;
  evidence: string[];
  warnings: string[];
  blockers: string[];
}

export type BuildPhaseId = 
  | 'EXTRACTING'
  | 'ANALYZING'
  | 'PREPARING_ENVIRONMENT'
  | 'GRADLE_BUILD'
  | 'LOCATING_APK'
  | 'VALIDATING_APK'
  | 'HASHING';

export interface PhaseInfo {
  id: BuildPhaseId;
  label: string;
  name?: string;
  description?: string;
  duration?: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
}

export interface BuildLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'cmd' | 'command';
  message: string;
}

export interface ArtifactInfo {
  fileName: string;
  fileSize: string;
  buildDuration: string;
  strategy: string;
  sha256: string;
  downloadUrl?: string;
  packageName?: string;
  versionCode?: string | number;
  versionName?: string;
  id?: string;
  sizeFormatted?: string;
  sizeBytes?: number;
  minSdk?: number;
  targetSdk?: number;
  timestamp?: string;
}

export interface BuildRecord {
  id: string;
  projectName: string;
  fileName: string;
  fileSize: string;
  status: BuildStatus;
  strategy: string;
  projectType: ProjectType;
  createdAt: string;
  duration: string;
  artifact?: ArtifactInfo;
  analysis?: ProjectAnalysis;
  phases: PhaseInfo[];
  logs: BuildLog[];
  failedPhase?: BuildPhaseId;
  errorMessage?: string;
}

interface BuildContextType {
  builds: BuildRecord[];
  activeBuild: BuildRecord | null;
  status: BuildStatus;
  isSimulating: boolean;
  activePhase: BuildPhaseId | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: 'all' | 'success' | 'running' | 'failed';
  setStatusFilter: (f: 'all' | 'success' | 'running' | 'failed') => void;
  startInspection: (file: { name: string; size: number }, projectName?: string, preset?: ProjectType) => Promise<string>;
  startBuild: (buildId?: string, simulateFailure?: boolean) => Promise<void>;
  cancelBuild: () => void;
  retryBuild: (simulateFailure?: boolean) => void;
  selectBuild: (buildId: string) => void;
  deleteBuild: (buildId: string) => void;
  addLog: (level: BuildLog['level'], message: string) => void;
  exportLogsAsText: () => string;
}

const INITIAL_PHASES: PhaseInfo[] = [
  { id: 'EXTRACTING', label: 'EXTRACTING', status: 'PENDING' },
  { id: 'ANALYZING', label: 'ANALYZING', status: 'PENDING' },
  { id: 'PREPARING_ENVIRONMENT', label: 'PREPARING ENVIRONMENT', status: 'PENDING' },
  { id: 'GRADLE_BUILD', label: 'GRADLE BUILD', status: 'PENDING' },
  { id: 'LOCATING_APK', label: 'LOCATING APK', status: 'PENDING' },
  { id: 'VALIDATING_APK', label: 'VALIDATING APK', status: 'PENDING' },
  { id: 'HASHING', label: 'HASHING', status: 'PENDING' },
];

const SEED_BUILDS: BuildRecord[] = [
  {
    id: 'bld-9821-android-gps',
    projectName: 'TrailPulse GPS Tracker',
    fileName: 'trailpulse-mobile-v2.zip',
    fileSize: '14.2 MB',
    status: 'SUCCESS',
    strategy: 'Capacitor Android Gradle',
    projectType: 'Capacitor',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    duration: '48.2s',
    artifact: {
      fileName: 'trailpulse-v2-debug.apk',
      fileSize: '18.4 MB',
      buildDuration: '48.2s',
      strategy: 'Capacitor Android Gradle AssembleDebug',
      sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      downloadUrl: '#',
      packageName: 'com.trailpulse.tracker',
      versionCode: '10204',
    },
    phases: INITIAL_PHASES.map((p) => ({ ...p, status: 'COMPLETED' })),
    logs: [
      { timestamp: '14:22:01', level: 'info', message: 'Project archive unzipped successfully: 482 files processed.' },
      { timestamp: '14:22:03', level: 'info', message: 'Capacitor config detected: @capacitor/android 6.1.2.' },
      { timestamp: '14:22:07', level: 'cmd', message: './gradlew assembleDebug --no-daemon -Dorg.gradle.parallel=true' },
      { timestamp: '14:22:25', level: 'info', message: ':app:compileDebugKotlin UP-TO-DATE' },
      { timestamp: '14:22:42', level: 'success', message: 'BUILD SUCCESSFUL in 41s (52 actionable tasks)' },
      { timestamp: '14:22:45', level: 'success', message: 'Generated APK verified: SHA-256 computed.' },
    ],
  },
  {
    id: 'bld-8842-photo-cam',
    projectName: 'PhotoStudio Offline',
    fileName: 'photo-studio-core.zip',
    fileSize: '32.6 MB',
    status: 'SUCCESS',
    strategy: 'Native Gradle',
    projectType: 'Native Android',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    duration: '1m 12s',
    artifact: {
      fileName: 'photostudio-debug.apk',
      fileSize: '24.1 MB',
      buildDuration: '1m 12s',
      strategy: 'Native Android Gradle (AGP 8.3)',
      sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      downloadUrl: '#',
      packageName: 'com.aiphotostudio.app',
      versionCode: '2001',
    },
    phases: INITIAL_PHASES.map((p) => ({ ...p, status: 'COMPLETED' })),
    logs: [
      { timestamp: '11:15:00', level: 'info', message: 'Native Android Gradle root recognized.' },
      { timestamp: '11:15:30', level: 'cmd', message: './gradlew assembleDebug' },
      { timestamp: '11:16:10', level: 'success', message: 'BUILD SUCCESSFUL' },
    ],
  },
  {
    id: 'bld-7629-vite-dash',
    projectName: 'Telemetry Sensor Web',
    fileName: 'sensor-telemetry-vite.zip',
    fileSize: '8.4 MB',
    status: 'FAILED',
    strategy: 'Android WebView Shell',
    projectType: 'React / Vite',
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    duration: '23.4s',
    failedPhase: 'GRADLE_BUILD',
    errorMessage: 'Vite build output "dist/" was empty before injection into Android asset directory.',
    phases: [
      { id: 'EXTRACTING', label: 'EXTRACTING', status: 'COMPLETED' },
      { id: 'ANALYZING', label: 'ANALYZING', status: 'COMPLETED' },
      { id: 'PREPARING_ENVIRONMENT', label: 'PREPARING ENVIRONMENT', status: 'COMPLETED' },
      { id: 'GRADLE_BUILD', label: 'GRADLE BUILD', status: 'FAILED' },
      { id: 'LOCATING_APK', label: 'LOCATING APK', status: 'PENDING' },
      { id: 'VALIDATING_APK', label: 'VALIDATING APK', status: 'PENDING' },
      { id: 'HASHING', label: 'HASHING', status: 'PENDING' },
    ],
    logs: [
      { timestamp: '08:40:11', level: 'info', message: 'React/Vite project parsed with package.json scripts.' },
      { timestamp: '08:40:18', level: 'cmd', message: 'npm run build' },
      { timestamp: '08:40:24', level: 'error', message: 'Error: Cannot find module "@rollup/rollup-linux-x64-gnu"' },
      { timestamp: '08:40:25', level: 'error', message: 'Vite compilation exited with code 1. Halting pipeline.' },
    ],
  },
];

const BuildContext = createContext<BuildContextType | undefined>(undefined);

export function BuildProvider({ children }: { children: ReactNode }) {
  const [builds, setBuilds] = useState<BuildRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('zip-apk-builds');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // fallback
        }
      }
    }
    return SEED_BUILDS;
  });

  const [activeBuildId, setActiveBuildId] = useState<string>(SEED_BUILDS[0].id);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activePhase, setActivePhase] = useState<BuildPhaseId | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'running' | 'failed'>('all');
  const timerRef = useRef<NodeJS.Timeout[]>([]);

  const activeBuild = builds.find((b) => b.id === activeBuildId) || builds[0] || null;
  const status = activeBuild?.status || 'IDLE';

  useEffect(() => {
    try {
      localStorage.setItem('zip-apk-builds', JSON.stringify(builds));
    } catch {
      // ignore storage quota issues
    }
  }, [builds]);

  const clearTimers = () => {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
  };

  const addLog = (level: BuildLog['level'], message: string) => {
    const time = new Date().toTimeString().slice(0, 8);
    setBuilds((prev) =>
      prev.map((b) => {
        if (b.id !== activeBuildId) return b;
        return {
          ...b,
          logs: [...b.logs, { timestamp: time, level, message }],
        };
      })
    );
  };

  const startInspection = async (
    file: { name: string; size: number },
    customName?: string,
    preset?: ProjectType
  ): Promise<string> => {
    clearTimers();
    const id = `bld-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString(36).slice(-4)}`;
    const projectName = customName || file.name.replace(/\.zip$/i, '') || 'New Android Project';
    const fileSizeFormatted = file.size < 1024 * 1024 
      ? `${(file.size / 1024).toFixed(1)} KB` 
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    // Determine analysis based on preset or filename
    let detectedType: ProjectType = preset || 'Capacitor';
    if (!preset) {
      const lower = file.name.toLowerCase();
      if (lower.includes('android') || lower.includes('native') || lower.includes('gradle')) {
        detectedType = 'Native Android';
      } else if (lower.includes('vite') || lower.includes('react') || lower.includes('spa')) {
        detectedType = 'React / Vite';
      } else if (lower.includes('cap') || lower.includes('photo') || lower.includes('studio')) {
        detectedType = 'Capacitor';
      } else {
        detectedType = 'Capacitor';
      }
    }

    const mockAnalysis: ProjectAnalysis = {
      projectType: detectedType,
      confidence: detectedType === 'Capacitor' ? 'High' : 'High',
      strategy: detectedType === 'Native Android' 
        ? 'Native Gradle (Android AGP 8.3)' 
        : detectedType === 'Capacitor'
        ? 'Capacitor Android Gradle AssembleDebug'
        : 'Vite Static Extraction + Android WebView Shell',
      compatibilityScore: detectedType === 'Capacitor' ? 98 : detectedType === 'Native Android' ? 95 : 88,
      framework: detectedType === 'Capacitor' ? 'Capacitor 6.x (React / TypeScript)' : detectedType === 'Native Android' ? 'Android Jetpack Compose' : 'React 19 + Vite 6',
      buildTool: 'Gradle 8.4 + AGP 8.3.1',
      language: detectedType === 'Native Android' ? 'Kotlin 1.9.22' : 'TypeScript 5.8',
      packageManager: 'pnpm / npm',
      minSdk: 24,
      targetSdk: 34,
      evidence: [
        `${detectedType} project structure validated in root archive.`,
        'Android platform directory /android confirmed with valid settings.gradle and gradlew wrapper.',
        'Target SDK 34 meets modern Google Play and device installation standards.',
        'No prohibited native architecture collisions detected across arm64-v8a and armeabi-v7a.',
        'Debug keystore configuration is present and configured for unsigned/debug assemble.',
      ],
      warnings: [
        'Release signing key is not embedded; build will generate signed debug APK (suitable for test devices).',
        'Large media assets detected in public directory; compressed WebP recommended for production.',
      ],
      blockers: [],
    };

    const newRecord: BuildRecord = {
      id,
      projectName,
      fileName: file.name,
      fileSize: fileSizeFormatted,
      status: 'INSPECTING',
      strategy: mockAnalysis.strategy,
      projectType: detectedType,
      createdAt: new Date().toISOString(),
      duration: '0s',
      analysis: mockAnalysis,
      phases: INITIAL_PHASES.map((p) => ({ ...p, status: 'PENDING' })),
      logs: [
        { timestamp: new Date().toTimeString().slice(0, 8), level: 'info', message: `ZIP archive received: ${file.name} (${fileSizeFormatted})` },
        { timestamp: new Date().toTimeString().slice(0, 8), level: 'info', message: 'Validating zip header and directory integrity...' },
      ],
    };

    setBuilds((prev) => [newRecord, ...prev]);
    setActiveBuildId(id);
    setIsSimulating(true);

    // Sequence of inspection steps
    const t1 = setTimeout(() => {
      setBuilds((prev) =>
        prev.map((b) => {
          if (b.id !== id) return b;
          return {
            ...b,
            logs: [
              ...b.logs,
              { timestamp: new Date().toTimeString().slice(0, 8), level: 'info', message: 'Scanning file tree: extracting manifest, config, and source signatures...' },
              { timestamp: new Date().toTimeString().slice(0, 8), level: 'cmd', message: 'inspect --format=ast-tree ./unpacked' },
            ],
          };
        })
      );
    }, 900);

    const t2 = setTimeout(() => {
      setBuilds((prev) =>
        prev.map((b) => {
          if (b.id !== id) return b;
          return {
            ...b,
            logs: [
              ...b.logs,
              { timestamp: new Date().toTimeString().slice(0, 8), level: 'success', message: `Signature identified: ${detectedType} project detected with High confidence.` },
              { timestamp: new Date().toTimeString().slice(0, 8), level: 'info', message: 'Generating readiness score and compatibility matrix...' },
            ],
          };
        })
      );
    }, 1800);

    const t3 = setTimeout(() => {
      setBuilds((prev) =>
        prev.map((b) => {
          if (b.id !== id) return b;
          return {
            ...b,
            status: 'ANALYZED',
            logs: [
              ...b.logs,
              { timestamp: new Date().toTimeString().slice(0, 8), level: 'success', message: `Analysis complete. Compatibility score: ${mockAnalysis.compatibilityScore}/100. Ready for build execution.` },
            ],
          };
        })
      );
      setIsSimulating(false);
    }, 2800);

    timerRef.current.push(t1, t2, t3);
    return id;
  };

  const startBuild = async (targetId?: string, simulateFailure = false): Promise<void> => {
    clearTimers();
    const id = targetId || activeBuildId;
    setActiveBuildId(id);
    setIsSimulating(true);

    const startTime = Date.now();

    // Mark as building
    setBuilds((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        return {
          ...b,
          status: 'BUILDING',
          failedPhase: undefined,
          errorMessage: undefined,
          phases: INITIAL_PHASES.map((p) => ({ ...p, status: 'PENDING' })),
          logs: [
            ...b.logs,
            { timestamp: new Date().toTimeString().slice(0, 8), level: 'cmd', message: '=== INITIATING BUILD PIPELINE ===' },
            { timestamp: new Date().toTimeString().slice(0, 8), level: 'info', message: 'Environment verification: JDK 17.0.10, Gradle 8.4, Android SDK 34.' },
          ],
        };
      })
    );

    const phaseSequence: { phase: BuildPhaseId; delay: number; log: string }[] = [
      { phase: 'EXTRACTING', delay: 400, log: 'Unpacking source payload into sandboxed isolated workspace...' },
      { phase: 'ANALYZING', delay: 1200, log: 'Validating package lockfile and checking AndroidManifest permissions...' },
      { phase: 'PREPARING_ENVIRONMENT', delay: 2200, log: 'Configuring local.properties with sdk.dir=/android/sdk...' },
      { phase: 'GRADLE_BUILD', delay: 3500, log: './gradlew assembleDebug --no-daemon --stacktrace' },
      { phase: 'LOCATING_APK', delay: 5600, log: 'Indexing build artifacts in android/app/build/outputs/apk/debug/' },
      { phase: 'VALIDATING_APK', delay: 6800, log: 'AAPT2 dump badging: validating launchable-activity and application-id...' },
      { phase: 'HASHING', delay: 7800, log: 'Computing SHA-256 fingerprint and generating APK manifest descriptor...' },
    ];

    phaseSequence.forEach((item, index) => {
      const t = setTimeout(() => {
        // If simulated failure happens at GRADLE_BUILD
        if (simulateFailure && item.phase === 'GRADLE_BUILD') {
          const failDuration = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;
          setBuilds((prev) =>
            prev.map((b) => {
              if (b.id !== id) return b;
              return {
                ...b,
                status: 'FAILED',
                duration: failDuration,
                failedPhase: 'GRADLE_BUILD',
                errorMessage: 'Execution failed for task ":app:mergeDebugResources". Resource linking error: AAPT: error: style attribute "@attr/colorSurfaceVariant" not found in Android theme.',
                phases: b.phases.map((p) => {
                  if (p.id === 'GRADLE_BUILD') return { ...p, status: 'FAILED' };
                  if (['EXTRACTING', 'ANALYZING', 'PREPARING_ENVIRONMENT'].includes(p.id)) return { ...p, status: 'COMPLETED' };
                  return { ...p, status: 'PENDING' };
                }),
                logs: [
                  ...b.logs,
                  { timestamp: new Date().toTimeString().slice(0, 8), level: 'cmd', message: item.log },
                  { timestamp: new Date().toTimeString().slice(0, 8), level: 'error', message: '> Task :app:mergeDebugResources FAILED' },
                  { timestamp: new Date().toTimeString().slice(0, 8), level: 'error', message: 'AAPT2: error: attribute "@color/customAccent" missing from resource values.xml' },
                  { timestamp: new Date().toTimeString().slice(0, 8), level: 'error', message: 'BUILD FAILED: 1 actionable task failed, 12 up-to-date.' },
                ],
              };
            })
          );
          setIsSimulating(false);
          setActivePhase(null);
          return;
        }

        setActivePhase(item.phase);

        setBuilds((prev) =>
          prev.map((b) => {
            if (b.id !== id) return b;
            const updatedPhases = b.phases.map((p) => {
              if (p.id === item.phase) return { ...p, status: 'ACTIVE' as const };
              const prevIndex = INITIAL_PHASES.findIndex((ip) => ip.id === p.id);
              if (prevIndex < index) return { ...p, status: 'COMPLETED' as const };
              return p;
            });

            return {
              ...b,
              phases: updatedPhases,
              logs: [
                ...b.logs,
                { timestamp: new Date().toTimeString().slice(0, 8), level: item.phase === 'GRADLE_BUILD' ? 'cmd' : 'info', message: item.log },
              ],
            };
          })
        );
      }, item.delay);

      timerRef.current.push(t);
    });

    if (!simulateFailure) {
      const finishTimer = setTimeout(() => {
        const totalDuration = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;
        const apkName = `${(activeBuild?.projectName || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-debug.apk`;
        const sha = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

        setBuilds((prev) =>
          prev.map((b) => {
            if (b.id !== id) return b;
            return {
              ...b,
              status: 'SUCCESS',
              duration: totalDuration,
              phases: b.phases.map((p) => ({ ...p, status: 'COMPLETED' })),
              artifact: {
                fileName: apkName,
                fileSize: '19.8 MB',
                buildDuration: totalDuration,
                strategy: b.strategy,
                sha256: sha,
                downloadUrl: '#',
                packageName: `com.${b.projectName.toLowerCase().replace(/[^a-z0-9]+/g, '')}.app`,
                versionCode: '10001',
              },
              logs: [
                ...b.logs,
                { timestamp: new Date().toTimeString().slice(0, 8), level: 'success', message: 'BUILD SUCCESSFUL in ' + totalDuration },
                { timestamp: new Date().toTimeString().slice(0, 8), level: 'success', message: `Output APK: android/app/build/outputs/apk/debug/${apkName}` },
                { timestamp: new Date().toTimeString().slice(0, 8), level: 'info', message: `SHA-256: ${sha}` },
                { timestamp: new Date().toTimeString().slice(0, 8), level: 'success', message: '✓ Artifact sealed and verified. Ready for immediate deployment or device test.' },
              ],
            };
          })
        );

        setIsSimulating(false);
        setActivePhase(null);
      }, 9200);

      timerRef.current.push(finishTimer);
    }
  };

  const cancelBuild = () => {
    clearTimers();
    setIsSimulating(false);
    setActivePhase(null);
    setBuilds((prev) =>
      prev.map((b) => {
        if (b.id !== activeBuildId) return b;
        return {
          ...b,
          status: 'FAILED',
          errorMessage: 'Build cancelled by user.',
          logs: [
            ...b.logs,
            { timestamp: new Date().toTimeString().slice(0, 8), level: 'warn', message: 'SIGINT received: Build pipeline stopped by developer command.' },
          ],
        };
      })
    );
  };

  const retryBuild = (simulateFailure = false) => {
    startBuild(activeBuildId, simulateFailure);
  };

  const selectBuild = (buildId: string) => {
    setActiveBuildId(buildId);
  };

  const deleteBuild = (buildId: string) => {
    setBuilds((prev) => prev.filter((b) => b.id !== buildId));
    if (activeBuildId === buildId && builds.length > 1) {
      const remaining = builds.filter((b) => b.id !== buildId);
      setActiveBuildId(remaining[0]?.id || '');
    }
  };

  const exportLogsAsText = () => {
    if (!activeBuild) return '';
    return activeBuild.logs.map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
  };

  return (
    <BuildContext.Provider
      value={{
        builds,
        activeBuild,
        status,
        isSimulating,
        activePhase,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        startInspection,
        startBuild,
        cancelBuild,
        retryBuild,
        selectBuild,
        deleteBuild,
        addLog,
        exportLogsAsText,
      }}
    >
      {children}
    </BuildContext.Provider>
  );
}

const defaultBuildContext: BuildContextType = {
  builds: [],
  activeBuild: null,
  status: 'IDLE',
  isSimulating: false,
  activePhase: 'EXTRACTING',
  searchQuery: '',
  setSearchQuery: () => {},
  statusFilter: 'all',
  setStatusFilter: () => {},
  startInspection: async () => 'build-init',
  startBuild: async () => {},
  cancelBuild: () => {},
  retryBuild: () => {},
  selectBuild: () => {},
  deleteBuild: () => {},
  addLog: () => {},
  exportLogsAsText: () => '',
};

export function useBuild() {
  const context = useContext(BuildContext);
  if (!context) {
    return defaultBuildContext;
  }
  return context;
}
