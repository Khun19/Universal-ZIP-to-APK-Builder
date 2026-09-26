# Builder Android App — Layer 1

Reserved for the native Android Builder UI.

Responsibilities:
- choose a ZIP;
- show security and analysis results;
- start a local build through the Termux bridge;
- display real build state and logs;
- show validated APK metadata;
- hand off install/share actions.

The app must not embed Java/Gradle/Android SDK/framework build toolchains. Those belong to Layer 2.
