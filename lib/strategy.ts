import { AnalysisResult } from './analyzer.ts';

export interface BuildStrategy {
  strategyName: 'native-gradle' | 'capacitor' | 'web-wrapper' | 'flutter' | 'react-native' | 'unknown';
  buildSteps: string[];
  outputArtifact: string;
}

export function determineBuildStrategy(analysis: AnalysisResult): BuildStrategy {
  switch (analysis.projectType) {
    case 'Native Android':
      return { strategyName: 'native-gradle', buildSteps: ['Verify Android SDK and Gradle Wrapper', 'Run ./gradlew assembleDebug', 'Locate APK in build/outputs/apk/debug/'], outputArtifact: 'app-wrapper-debug.apk' };
    case 'Capacitor':
      return { strategyName: 'capacitor', buildSteps: ['Verify Capacitor config and runtime dependency', 'Install JavaScript dependencies', 'Run the web build', 'Run Capacitor sync android (and add android when missing)', 'Run ./gradlew assembleDebug inside the Android platform', 'Locate and validate the APK'], outputArtifact: 'capacitor-debug.apk' };
    case 'React/Vite Web App':
      return { strategyName: 'web-wrapper', buildSteps: ['Verify React/Vite dependency and entry markers', 'Install Node modules (pnpm install / npm install)', 'Run Web Build (pnpm run build / vite build)', 'Inject web assets into Android WebView Wrapper', 'Run Gradle build to package APK'], outputArtifact: 'app-wrapper-debug.apk' };
    case 'Plain HTML/JS':
      return { strategyName: 'web-wrapper', buildSteps: ['Verify plain HTML entry point', 'Sanitize HTML/JS assets', 'Inject assets into Android WebView Wrapper', 'Run Gradle build to package APK'], outputArtifact: 'app-html-debug.apk' };
    case 'Flutter':
      return { strategyName: 'flutter', buildSteps: ['Verify pubspec.yaml and lib/main.dart', 'Verify Flutter SDK and Android toolchain', 'Run flutter pub get', 'Generate/recover Android platform when missing', 'Run flutter build apk --debug', 'Locate and validate the APK'], outputArtifact: 'app-debug.apk' };
    case 'Expo':
      return { strategyName: 'react-native', buildSteps: ['Verify explicit expo dependency', 'Install project dependencies with the detected package manager', 'Run local Expo prebuild when Android is missing', 'Run the Android Gradle build', 'Locate and validate the generated APK'], outputArtifact: 'app-debug.apk' };
    case 'React Native':
      return { strategyName: 'react-native', buildSteps: ['Verify explicit react-native dependency', 'Install project dependencies with the detected package manager', 'Require an existing Android Gradle project; bare React Native scaffold generation is not implemented yet', 'Run the Android Gradle build only when the Android project is present', 'Locate and validate the generated APK'], outputArtifact: 'app-debug.apk' };
    default:
      return { strategyName: 'unknown', buildSteps: [], outputArtifact: '' };
  }
}
