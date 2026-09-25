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
      return { strategyName: 'capacitor', buildSteps: ['Install JavaScript dependencies', 'Run the web build', 'Run Capacitor sync android (and add android when missing)', 'Run ./gradlew assembleDebug inside the Android platform', 'Locate and validate the APK'], outputArtifact: 'capacitor-debug.apk' };
    case 'React/Vite Web App':
      return { strategyName: 'web-wrapper', buildSteps: ['Install Node modules (pnpm install / npm install)', 'Run Web Build (pnpm run build / vite build)', 'Inject web assets into Android WebView Wrapper', 'Run Gradle build to package APK'], outputArtifact: 'app-wrapper-debug.apk' };
    case 'Plain HTML/JS':
      return { strategyName: 'web-wrapper', buildSteps: ['Sanitize HTML/JS assets', 'Inject assets into Android WebView Wrapper', 'Run Gradle build to package APK'], outputArtifact: 'app-html-debug.apk' };
    case 'Flutter':
      return { strategyName: 'flutter', buildSteps: ['Verify Flutter SDK and Android toolchain', 'Run flutter pub get', 'Run flutter build apk --debug', 'Locate APK in build/app/outputs/flutter-apk/'], outputArtifact: 'app-debug.apk' };
    case 'React Native':
      return {
        strategyName: 'react-native',
        buildSteps: [
          'Install React Native project dependencies with the detected package manager',
          'Require an Android project for pure React Native; do not synthesize a mock native project',
          'Prepare the official React Native build-from-source composite in the disposable workspace',
          'Use the project React Native Gradle Plugin and ReactAndroid/Hermes source modules',
          'Run the project Gradle build and let React Native own Metro, Hermes, Codegen, and native compilation',
          'Locate, validate, hash, install, and runtime-test the generated APK',
        ],
        outputArtifact: 'app-debug.apk',
      };
    case 'Expo':
      return {
        strategyName: 'react-native',
        buildSteps: [
          'Install Expo/React Native project dependencies with the detected package manager',
          'Run Expo prebuild only when the project is genuinely Expo-managed and android/ is absent',
          'Hand the resulting Android project to the official React Native/Expo native build flow',
          'Run the Android Gradle build',
          'Locate, validate, hash, install, and runtime-test the generated APK',
        ],
        outputArtifact: 'app-debug.apk',
      };
    default:
      return { strategyName: 'unknown', buildSteps: [], outputArtifact: '' };
  }
}
