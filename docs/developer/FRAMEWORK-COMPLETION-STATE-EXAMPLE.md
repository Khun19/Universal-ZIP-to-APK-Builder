# Framework Completion State — Example

This file is an example of the machine-checkable state model. It is intentionally not a claim that the framework is complete.

For an actual framework, the status must be regenerated from the current repository, tests, build artifacts, and device evidence.

## React Native example

```yaml
framework: react-native
strategy: official-react-native-android
official_flow: true
overall_status: BLOCKED
current_stage: RUNTIME
blocked_by:
  - "Runtime/native library loading failure must be resolved and re-verified on the target device."

next_required_action:
  - "Diagnose the first runtime failure from device logs."
  - "Trace the failure to the RN native/runtime packaging or configuration requirement."
  - "Implement the minimum framework-native fix."
  - "Rebuild a real APK."
  - "Install and launch on the target phone."
  - "Record runtime evidence before advancing."

prohibited_actions:
  - "Do not move to Expo before the React Native runtime gate passes."
  - "Do not replace React Native with a WebView implementation."
  - "Do not claim runtime PASS from APK build/install success alone."

stages:
  - id: DETECT
    status: PASS
    required: true

  - id: REQUIREMENTS
    status: PASS
    required: true

  - id: TOOLCHAIN
    status: PASS
    required: true

  - id: PREPARE
    status: PASS
    required: true

  - id: DEPENDENCIES
    status: PASS
    required: true

  - id: BUILD
    status: PASS
    required: true

  - id: APK_VALIDATION
    status: PASS
    required: true

  - id: INSTALL
    status: PASS
    required: true

  - id: RUNTIME
    status: FAIL
    required: true
    requirements:
      - id: RN-RUNTIME-001
        goal_reference: "Real React Native APK must launch and initialize its native runtime."
        acceptance_criteria:
          - "Application launches on the target device."
          - "React Native native runtime initializes without native library loading failure."
        status: FAIL
        evidence:
          - "Current device evidence reports a React Native native-library loading failure."
        next_actions:
          - "Identify the first native loading failure from runtime logs."
          - "Trace it to the generated RN Android configuration/package."
          - "Apply the framework-native fix and rebuild."
          - "Repeat install and runtime validation."

  - id: FUNCTIONAL_VALIDATION
    status: NOT_STARTED
    required: true

  - id: EVIDENCE
    status: IN_PROGRESS
    required: true
```
