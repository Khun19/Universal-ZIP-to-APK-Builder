# M5 Flutter fixture

This is a minimal real Flutter application. The pipeline intentionally receives
only `pubspec.yaml` and `lib/main.dart`; the Flutter executor generates the
Android platform when the ZIP does not include one, then runs `flutter pub get`
and `flutter build apk --debug`.
