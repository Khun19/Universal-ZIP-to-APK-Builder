import {
  BuildJobItem,
  ProjectAnalysisData,
  ProjectItem,
  EnvironmentTool,
  UserSettings,
} from '../types/builder';

export type {
  BuildJobItem,
  ProjectAnalysisData,
  ProjectItem,
  EnvironmentTool,
  UserSettings,
  BuildLog,
  BuildStatus,
  BuildStrategy,
  ProjectType,
} from '../types/builder';

export const INITIAL_ENVIRONMENT_TOOLS: EnvironmentTool[] = [
  {
    name: 'Android SDK',
    version: 'Android 14 (API Level 34)',
    status: 'READY',
    path: '/opt/android-sdk',
    description: 'Core platform libraries and platform-tools for target API 34.',
    category: 'Android',
    details: 'Installed platforms: android-34, android-33. NDK: 26.1.10909125',
  },
  {
    name: 'Android Build Tools',
    version: '34.0.0',
    status: 'READY',
    path: '/opt/android-sdk/build-tools/34.0.0',
    description: 'D8 dexer, apksigner, and resource compilers.',
    category: 'Android',
    details: 'All dex binaries verified with 64-bit host binaries.',
  },
  {
    name: 'Java Development Kit (JDK)',
    version: 'OpenJDK 17.0.10 (Temurin)',
    status: 'READY',
    path: '/usr/lib/jvm/temurin-17-jdk-amd64',
    description: 'Required JDK runtime for Gradle daemon and Android build tasks.',
    category: 'Runtime',
    details: 'JAVA_HOME is configured and passed to child Gradle processes.',
  },
  {
    name: 'Gradle Engine',
    version: '8.4',
    status: 'READY',
    path: '/opt/gradle-8.4/bin/gradle',
    description: 'Android build system orchestrator and dependency cache manager.',
    category: 'Build',
    details: 'Daemon memory limit: 4096MB. Parallel execution supported.',
  },
  {
    name: 'Node.js Runtime',
    version: 'v20.18.0 (LTS)',
    status: 'READY',
    path: '/usr/local/bin/node',
    description: 'JavaScript engine for web asset building, Vite, and Capacitor CLI hooks.',
    category: 'Runtime',
    details: 'Native bindings enabled, corepack enabled.',
  },
  {
    name: 'Package Manager (npm / pnpm)',
    version: 'npm 10.8.2 / pnpm 9.15.0',
    status: 'READY',
    path: '/usr/local/bin/npm',
    description: 'Web package dependencies resolver for hybrid projects.',
    category: 'Build',
    details: 'Local package cache isolated per build sandbox.',
  },
  {
    name: 'AAPT2 (Android Asset Packaging Tool 2)',
    version: '8.2.0-10154469',
    status: 'READY',
    path: '/opt/android-sdk/build-tools/34.0.0/aapt2',
    description: 'Compiles and packages Android app resources into binary format.',
    category: 'Android',
    details: 'Resource verification and table compiler operational.',
  },
];

export const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: 'proj-ai-photo-studio',
    name: 'AI Photo Studio',
    filename: 'ai-photo-studio-mobile.zip',
    fileSizeBytes: 42891240,
    createdAt: '2026-09-08T18:30:00Z',
    updatedAt: '2026-09-08T19:15:00Z',
    analysis: {
      projectId: 'proj-ai-photo-studio',
      projectName: 'AI Photo Studio',
      projectType: 'Capacitor',
      confidence: 98,
      strategy: 'Capacitor Android',
      framework: 'React 19 / Vite',
      language: 'TypeScript',
      buildTool: 'Capacitor Android (Gradle 8.4)',
      packageManager: 'npm / pnpm',
      minSdk: 22,
      targetSdk: 34,
      evidence: [
        'capacitor.config.ts verified in archive root',
        'Official @capacitor/core and @capacitor/android packages declared',
        'Pre-configured android/ native sub-project discovered with gradlew',
        'Vite build configuration generates dist/ web bundle',
        'Application ID: com.aiphotostudio.app',
      ],
      warnings: [
        'Android camera permissions declared in AndroidManifest.xml (requires runtime permission dialog)',
      ],
      blockers: [],
    },
    latestBuild: {
      id: 'build-aps-001',
      projectId: 'proj-ai-photo-studio',
      projectName: 'AI Photo Studio',
      status: 'SUCCESS',
      strategy: 'Capacitor Android',
      createdAt: '2026-09-08T19:10:00Z',
      completedAt: '2026-09-08T19:12:45Z',
      duration: '2m 45s',
      currentPhase: 'COMPLETE',
      artifact: {
        filename: 'ai-photo-studio-debug.apk',
        sizeBytes: 24658120,
        formattedSize: '23.5 MB',
        sha256: '7b83c18e5e8942b0c95237ff640954b4ea0a1c1d8820c78a0b0d381016fe59da',
        downloadUrl: '/api/artifacts/build-aps-001/download',
        versionName: '1.0.0',
        versionCode: 1,
        packageName: 'com.aiphotostudio.app',
      },
      logs: [
        { id: '1', timestamp: '19:10:01', level: 'info', message: 'Builder worker allocated on node-sand-04' },
        { id: '2', timestamp: '19:10:02', level: 'command', message: 'unzip -q ai-photo-studio-mobile.zip -d /workspace/source' },
        { id: '3', timestamp: '19:10:05', level: 'info', message: 'Extracted 1,428 files (40.9 MB unpacked)' },
        { id: '4', timestamp: '19:10:07', level: 'info', message: 'Detecting project markers: capacitor.config.ts found' },
        { id: '5', timestamp: '19:10:09', level: 'info', message: 'Framework: React + Vite + TypeScript' },
        { id: '6', timestamp: '19:10:12', level: 'command', message: 'npm run build' },
        { id: '7', timestamp: '19:10:28', level: 'info', message: 'vite v6.2.0 building for production...' },
        { id: '8', timestamp: '19:10:34', level: 'success', message: 'dist/ generated successfully: 48 assets (3.2 MB)' },
        { id: '9', timestamp: '19:10:35', level: 'command', message: 'npx cap sync android' },
        { id: '10', timestamp: '19:10:45', level: 'info', message: 'Syncing web assets to android/app/src/main/assets/public' },
        { id: '11', timestamp: '19:10:48', level: 'command', message: 'cd android && ./gradlew assembleDebug --no-daemon' },
        { id: '12', timestamp: '19:11:15', level: 'info', message: ':app:preBuild UP-TO-DATE' },
        { id: '13', timestamp: '19:11:42', level: 'info', message: ':app:compileDebugJavaWithJavac (18 source files)' },
        { id: '14', timestamp: '19:12:05', level: 'info', message: ':app:dexBuilderDebug processing classes...' },
        { id: '15', timestamp: '19:12:28', level: 'info', message: ':app:packageDebug signed with debug keystore' },
        { id: '16', timestamp: '19:12:35', level: 'success', message: 'BUILD SUCCESSFUL in 1m 47s (38 actionable tasks)' },
        { id: '17', timestamp: '19:12:37', level: 'info', message: 'Locating output APK: android/app/build/outputs/apk/debug/app-debug.apk' },
        { id: '18', timestamp: '19:12:40', level: 'info', message: 'Running apksigner verify and zipalign check... PASS' },
        { id: '19', timestamp: '19:12:42', level: 'info', message: 'Calculated SHA-256: 7b83c18e5e8942b0c95237ff640954b4...' },
        { id: '20', timestamp: '19:12:45', level: 'success', message: 'Artifact registered. APK ready for distribution.' },
      ],
    },
  },
  {
    id: 'proj-field-notes-android',
    name: 'Field Notes Android',
    filename: 'field-notes-native.zip',
    fileSizeBytes: 28410500,
    createdAt: '2026-09-08T15:20:00Z',
    updatedAt: '2026-09-08T15:35:00Z',
    analysis: {
      projectId: 'proj-field-notes-android',
      projectName: 'Field Notes Android',
      projectType: 'Native Android',
      confidence: 100,
      strategy: 'Native Gradle',
      framework: 'Jetpack Compose / Kotlin',
      language: 'Kotlin 2.0',
      buildTool: 'Gradle 8.4',
      packageManager: 'Gradle / Maven Central',
      minSdk: 26,
      targetSdk: 34,
      evidence: [
        'Root build.gradle.kts and settings.gradle.kts present',
        'App module found in :app directory with AndroidManifest.xml',
        'Gradle wrapper gradlew verified with checksum 8.4',
        'compileSdk 34 configured in build.gradle.kts',
      ],
      warnings: [],
      blockers: [],
    },
    latestBuild: {
      id: 'build-fna-002',
      projectId: 'proj-field-notes-android',
      projectName: 'Field Notes Android',
      status: 'SUCCESS',
      strategy: 'Native Gradle',
      createdAt: '2026-09-08T15:30:00Z',
      completedAt: '2026-09-08T15:32:15Z',
      duration: '2m 15s',
      currentPhase: 'COMPLETE',
      artifact: {
        filename: 'field-notes-debug.apk',
        sizeBytes: 15410920,
        formattedSize: '14.7 MB',
        sha256: '4a6b29d10e3f89e24b75961a8a2d18471c08be2f7415d96c46a84d41e7371905',
        downloadUrl: '/api/artifacts/build-fna-002/download',
        versionName: '2.1.0',
        versionCode: 14,
        packageName: 'org.fieldnotes.mobile',
      },
      logs: [
        { id: '1', timestamp: '15:30:01', level: 'info', message: 'Extracting field-notes-native.zip' },
        { id: '2', timestamp: '15:30:04', level: 'info', message: 'Inspecting source: Native Android Kotlin Project' },
        { id: '3', timestamp: '15:30:10', level: 'command', message: './gradlew assembleDebug --no-daemon' },
        { id: '4', timestamp: '15:31:00', level: 'info', message: ':app:compileDebugKotlin finished in 24s' },
        { id: '5', timestamp: '15:32:00', level: 'success', message: 'BUILD SUCCESSFUL in 1m 50s' },
        { id: '6', timestamp: '15:32:15', level: 'success', message: 'Validated artifact field-notes-debug.apk (14.7 MB)' },
      ],
    },
  },
  {
    id: 'proj-zen-dashboard',
    name: 'Zen Dashboard App',
    filename: 'zen-dashboard-react.zip',
    fileSizeBytes: 18250000,
    createdAt: '2026-09-08T14:10:00Z',
    updatedAt: '2026-09-08T14:25:00Z',
    analysis: {
      projectId: 'proj-zen-dashboard',
      projectName: 'Zen Dashboard App',
      projectType: 'React / Vite',
      confidence: 85,
      strategy: 'Capacitor Android',
      framework: 'React 18 / Vite',
      language: 'JavaScript',
      buildTool: 'Vite 5 / Auto-scaffolded Capacitor',
      packageManager: 'npm',
      minSdk: 22,
      targetSdk: 34,
      evidence: [
        'package.json with "vite" and "react" dependencies',
        'index.html and src/ main entry detected',
        'Automatic Capacitor Android injection strategy selected',
      ],
      warnings: [
        'Pure web project: Builder will synthesize a standard Capacitor wrapper shell for Android packaging',
      ],
      blockers: [],
    },
    latestBuild: {
      id: 'build-zen-003',
      projectId: 'proj-zen-dashboard',
      projectName: 'Zen Dashboard App',
      status: 'FAILED',
      strategy: 'Capacitor Android',
      createdAt: '2026-09-08T14:20:00Z',
      completedAt: '2026-09-08T14:22:10Z',
      duration: '2m 10s',
      currentPhase: 'GRADLE BUILD',
      failedPhase: 'GRADLE BUILD',
      errorMessage: 'Execution failed for task :app:processDebugResources. AAPT2: duplicate resource identifier',
      logs: [
        { id: '1', timestamp: '14:20:01', level: 'info', message: 'Extracting zen-dashboard-react.zip' },
        { id: '2', timestamp: '14:20:10', level: 'info', message: 'Scaffolding Android Capacitor template' },
        { id: '3', timestamp: '14:20:30', level: 'command', message: 'npm run build' },
        { id: '4', timestamp: '14:21:00', level: 'info', message: 'Web build succeeded.' },
        { id: '5', timestamp: '14:21:20', level: 'command', message: 'cd android && ./gradlew assembleDebug' },
        { id: '6', timestamp: '14:22:05', level: 'error', message: 'AAPT2 error: resource color/primary has already been defined' },
        { id: '7', timestamp: '14:22:10', level: 'error', message: 'BUILD FAILED: Execution failed for task :app:processDebugResources' },
      ],
    },
  },
];

export const INITIAL_SETTINGS: UserSettings = {
  theme: 'dark',
  defaultStrategy: 'auto',
  cleanCacheBeforeBuild: true,
  verboseLogging: false,
  autoScrollLogs: true,
  soundNotifications: false,
  desktopNotifications: false,
  density: 'comfortable',
};

// Local storage management helpers
const STORAGE_KEYS = {
  PROJECTS: 'universal_builder_projects',
  SETTINGS: 'universal_builder_settings',
  ACTIVE_BUILD: 'universal_builder_active_build',
};

export function getStoredProjects(): ProjectItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  // Default to initial projects
  saveStoredProjects(INITIAL_PROJECTS);
  return INITIAL_PROJECTS;
}

export function saveStoredProjects(projects: ProjectItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  } catch {}
}

export function getStoredSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      return { ...INITIAL_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {}
  return INITIAL_SETTINGS;
}

export function saveStoredSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch {}
}
