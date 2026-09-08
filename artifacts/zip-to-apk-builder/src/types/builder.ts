export type BuildStrategy = 'Native Gradle' | 'Capacitor Android' | 'Web-Wrapper WebView' | 'Custom Container';

export type ProjectType = 'Native Android' | 'Capacitor' | 'React / Vite' | 'Web Project' | 'Unknown';

export type BuildStatus = 'QUEUED' | 'ANALYZING' | 'PREPARING' | 'BUILDING' | 'VALIDATING' | 'SUCCESS' | 'FAILED';

export interface BuildLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'cmd' | 'command';
  message: string;
}

export interface BuildJobItem {
  id: string;
  projectId: string;
  projectName: string;
  status: BuildStatus;
  strategy: BuildStrategy;
  createdAt: string;
  completedAt?: string;
  duration: string;
  currentPhase: string;
  failedPhase?: string;
  errorMessage?: string;
  artifact?: {
    filename: string;
    sizeBytes: number;
    formattedSize: string;
    sha256: string;
    downloadUrl: string;
    versionName: string;
    versionCode: number;
    packageName: string;
  };
  logs: BuildLog[];
}

export interface ProjectAnalysisData {
  projectId: string;
  projectName: string;
  projectType: ProjectType;
  confidence: number; // 0 - 100
  strategy: BuildStrategy;
  framework: string;
  language: string;
  buildTool: string;
  packageManager: string;
  minSdk: number;
  targetSdk: number;
  evidence: string[];
  warnings: string[];
  blockers: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  filename: string;
  fileSizeBytes: number;
  createdAt: string;
  updatedAt: string;
  analysis?: ProjectAnalysisData;
  latestBuild?: BuildJobItem;
}

export interface EnvironmentTool {
  name: string;
  version: string;
  status: 'READY' | 'WARNING' | 'ERROR';
  path: string;
  description: string;
  category: 'Android' | 'Build' | 'Runtime';
  details?: string;
}

export interface UserSettings {
  theme: 'system' | 'light' | 'dark';
  defaultStrategy: 'auto' | 'native' | 'capacitor' | 'web';
  cleanCacheBeforeBuild: boolean;
  verboseLogging: boolean;
  autoScrollLogs: boolean;
  soundNotifications: boolean;
  desktopNotifications: boolean;
  density: 'comfortable' | 'compact';
}
