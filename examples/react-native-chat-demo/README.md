# Community Chat Demo (offline)

A standalone React Native 0.76.9 Android demo fixture for testing the Universal ZIP-to-APK Builder from a project ZIP.

## Included flows
- Browse three local communities
- Open a community and choose channels
- Read local sample messages and send a local message
- Open the profile screen and return to chat/communities
- Tap the interaction counter

No remote service or backend is required. Android native scaffolding is generated in the isolated CI workspace; it is not committed into this source fixture.

## Validation boundary
CI build success and physical-device acceptance are separate. The generated APK must be installed and checked on a real phone before this fixture is marked accepted.
