import { AnalysisResult } from './analyzer.ts';

export interface BuildStrategy {
  strategyName: 'native-gradle' | 'capacitor' | 'web-wrapper' | 'flutter' | 'unknown';
  buildSteps: string[];
  outputArtifact: string;
}

/**
 * Selects the appropriate build strategy based on project analysis
 */
export function determineBuildStrategy(analysis: AnalysisResult): BuildStrategy {
  switch (analysis.projectType) {
    case 'Native Android':
      return {
        strategyName: 'native-gradle',
        buildSteps: [
          'Verify Android SDK and Gradle Wrapper',
          'Run ./gradlew assembleDebug',
          'Locate APK in build/outputs/apk/debug/'
        ],
        outputArtifact: 'app-wrapper-debug.apk'
      };

    case 'Capacitor':
      return {
        strategyName: 'capacitor',
        buildSteps: [
          'Install JavaScript dependencies',
          'Run the web build',
          'Run Capacitor sync android (and add android when missing)',
          'Run ./gradlew assembleDebug inside the Android platform',
          'Locate and validate the APK'
        ],
        outputArtifact: 'capacitor-debug.apk'
      };

    case 'React/Vite Web App':
      return {
        strategyName: 'web-wrapper',
        buildSteps: [
          'Install Node modules (pnpm install / npm install)',
          'Run Web Build (pnpm run build / vite build)',
          'Inject web assets into Android WebView Wrapper',
          'Run Gradle build to package APK'
        ],
        outputArtifact: 'app-wrapper-debug.apk'
      };

    case 'Plain HTML/JS':
      return {
        strategyName: 'web-wrapper',
        buildSteps: [
          'Sanitize HTML/JS assets',
          'Inject assets into Android WebView Wrapper',
          'Run Gradle build to package APK'
        ],
        outputArtifact: 'app-html-debug.apk'
      };

    case 'Flutter':
      return {
        strategyName: 'flutter',
        buildSteps: [
          'Verify Flutter SDK and Android toolchain',
          'Resolve a runnable Flutter executor for the current OS',
          'Run flutter pub get',
          'Run flutter build apk --debug',
          'Locate and validate the APK'
        ],
        outputArtifact: 'app-debug.apk'
      };

    default:
      return {
        strategyName: 'unknown',
        buildSteps: [],
        outputArtifact: ''
      };
  }
}
