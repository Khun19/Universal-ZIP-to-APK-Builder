# Community Chat Demo (React Native)

An offline, local-data-only community chat demo intended for the Universal ZIP-to-APK Builder acceptance test.

## Included screens

- Communities/servers list
- Channel list for the selected community
- Channel conversation with local sample messages
- Message composer that appends messages locally
- Profile screen
- Bottom navigation and channel selection
- Tap counter to make interaction acceptance visible

## Runtime

- React Native 0.76.9
- React 18.3.1
- No backend, account, network API, or third-party UI library required.

## ZIP layout

The ZIP project root must contain `package.json`, `index.js`, `App.js`, `app.json`, and `react-native.config.js` directly. Do not ZIP the parent directory; ZIP the contents of this directory.

## Acceptance checklist

1. Builder detects React Native from the ZIP root.
2. Dependency preparation and Android native build complete.
3. APK is found and passes structural/manifest validation.
4. Install and launch on a real Android device.
5. Switch between Communities, Chat, and Profile.
6. Select a channel, send a local message, and increment the tap counter.

Passing repository CI alone does not establish the real-device acceptance criteria.
