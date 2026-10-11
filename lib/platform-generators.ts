/**
 * Framework-specific Android platform preparation plans.
 *
 * This registry deliberately does not use one generic scaffold for every
 * framework. The worker owns execution; each adapter declares its generator,
 * prerequisites, and post-generation validation contract.
 */
export type PlatformFramework =
  | 'Native Android'
  | 'React Native'
  | 'Expo'
  | 'Capacitor'
  | 'Flutter'
  | 'React/Vite Web App'
  | 'Plain HTML/JS'
  | 'Unknown';

export type PlatformGeneratorId =
  | 'none-existing-android'
  | 'react-native-community-cli'
  | 'expo-prebuild'
  | 'capacitor-add-sync'
  | 'flutter-create-platform'
  | 'webview-template'
  | 'blocked-unknown';

export interface PlatformPreparationPlan {
  framework: PlatformFramework;
  generator: PlatformGeneratorId;
  requiresExistingAndroid: boolean;
  preserveSourceFiles: string[];
  steps: string[];
  requiredOutputs: string[];
  validation: string[];
}

const plans: Record<PlatformFramework, PlatformPreparationPlan> = {
  'Native Android': {
    framework: 'Native Android',
    generator: 'none-existing-android',
    requiresExistingAndroid: true,
    preserveSourceFiles: [],
    steps: ['Validate the supplied Android Gradle project; do not regenerate it automatically'],
    requiredOutputs: ['settings.gradle or settings.gradle.kts', 'app/build.gradle or app/build.gradle.kts', 'AndroidManifest.xml'],
    validation: ['Resolve the Android project root', 'Validate Gradle and manifest markers before compilation'],
  },
  'React Native': {
    framework: 'React Native',
    generator: 'react-native-community-cli',
    requiresExistingAndroid: false,
    preserveSourceFiles: ['package.json', 'App.*', 'index.*', 'src/', 'assets/', userSourceMarker()],
    steps: [
      'Read the exact react-native version from package.json',
      'Generate a temporary bare React Native project with a compatible Community CLI version',
      'Copy only the generated android/ platform into the source project when android/ is absent',
      'Never run Expo prebuild unless expo is an explicit runtime dependency',
    ],
    requiredOutputs: ['android/settings.gradle or settings.gradle.kts', 'android/app/build.gradle or build.gradle.kts', 'android/app/src/main/AndroidManifest.xml'],
    validation: ['Check generated Gradle files and Android manifest', 'Check MainActivity and MainApplication sources', 'Verify package name and React Native Gradle plugin wiring', 'Fail with a clear diagnostic if generated files are incomplete'],
  },
  Expo: {
    framework: 'Expo',
    generator: 'expo-prebuild',
    requiresExistingAndroid: false,
    preserveSourceFiles: ['package.json', 'app.json', 'app.config.*', 'App.*', 'src/', 'assets/'],
    steps: ['Require an explicit expo dependency', 'Run local Expo prebuild for Android only when needed', 'Do not replace the Expo path with the bare React Native generator'],
    requiredOutputs: ['android/settings.gradle or settings.gradle.kts', 'android/app/build.gradle or build.gradle.kts', 'android/app/src/main/AndroidManifest.xml'],
    validation: ['Validate generated Android Gradle project', 'Validate Expo native modules and package configuration'],
  },
  Capacitor: {
    framework: 'Capacitor',
    generator: 'capacitor-add-sync',
    requiresExistingAndroid: false,
    preserveSourceFiles: ['package.json', 'capacitor.config.*', 'src/', 'public/', 'www/'],
    steps: ['Require Capacitor config and @capacitor/core or @capacitor/android dependency', 'Build web assets', 'Run Capacitor Android add/sync only when the Android platform is absent or stale'],
    requiredOutputs: ['android/settings.gradle or settings.gradle.kts', 'android/app/build.gradle or build.gradle.kts', 'android/app/src/main/AndroidManifest.xml'],
    validation: ['Validate Capacitor Android platform and web asset destination', 'Validate Gradle project before build'],
  },
  Flutter: {
    framework: 'Flutter',
    generator: 'flutter-create-platform',
    requiresExistingAndroid: false,
    preserveSourceFiles: ['pubspec.yaml', 'lib/', 'assets/', 'test/'],
    steps: ['Use the selected Flutter SDK to generate or recover the Android platform only', 'Preserve the original Dart source, pubspec, and assets'],
    requiredOutputs: ['android/settings.gradle or settings.gradle.kts', 'android/app/build.gradle or build.gradle.kts', 'android/app/src/main/AndroidManifest.xml'],
    validation: ['Validate Flutter Gradle plugin markers', 'Run flutter pub get before flutter build apk'],
  },
  'React/Vite Web App': {
    framework: 'React/Vite Web App',
    generator: 'webview-template',
    requiresExistingAndroid: false,
    preserveSourceFiles: ['package.json', 'src/', 'public/', 'index.html', 'vite.config.*'],
    steps: ['Build the web application', 'Generate the dedicated WebView Android wrapper template', 'Copy built assets into the wrapper'],
    requiredOutputs: ['android/settings.gradle or settings.gradle.kts', 'android/app/build.gradle or build.gradle.kts', 'android/app/src/main/AndroidManifest.xml'],
    validation: ['Validate web build output', 'Validate generated Android wrapper before Gradle build'],
  },
  'Plain HTML/JS': {
    framework: 'Plain HTML/JS',
    generator: 'webview-template',
    requiresExistingAndroid: false,
    preserveSourceFiles: ['index.html', '*.js', '*.css', 'assets/'],
    steps: ['Sanitize and stage web assets', 'Generate the dedicated WebView Android wrapper template'],
    requiredOutputs: ['android/settings.gradle or settings.gradle.kts', 'android/app/build.gradle or build.gradle.kts', 'android/app/src/main/AndroidManifest.xml'],
    validation: ['Validate index.html and staged assets', 'Validate generated Android wrapper before Gradle build'],
  },
  Unknown: {
    framework: 'Unknown',
    generator: 'blocked-unknown',
    requiresExistingAndroid: false,
    preserveSourceFiles: [],
    steps: ['Stop and request a supported project structure; do not guess a framework or scaffold'],
    requiredOutputs: [],
    validation: ['Require explicit framework evidence before allowing build execution'],
  },
};

function userSourceMarker(): string {
  return 'Do not overwrite user-owned source files';
}

export function getPlatformPreparationPlan(framework: PlatformFramework): PlatformPreparationPlan {
  const plan = plans[framework];
  return {
    ...plan,
    preserveSourceFiles: [...plan.preserveSourceFiles],
    steps: [...plan.steps],
    requiredOutputs: [...plan.requiredOutputs],
    validation: [...plan.validation],
  };
}
