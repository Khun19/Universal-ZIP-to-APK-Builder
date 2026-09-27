# User Documentation

This directory is for people using the Universal ZIP-to-APK Builder, not for developers implementing the Builder.

## Audience

A Builder user wants to:
- select or provide a project ZIP
- understand whether the project can be processed
- start a build
- understand the visible build status
- obtain the resulting APK
- install/use the APK
- understand user-facing errors and required input

## User documentation must not contain

- internal architecture decisions
- framework strategy implementation details
- developer-only build commands
- source-code paths
- internal failure classifications
- milestone gates
- GitHub/Termux engineering procedures
- internal test evidence requirements

Those belong under docs/developer/.

## User-facing flow

~~~
USER
  ↓
Select ZIP
  ↓
Analyze
  ↓
Review compatibility/result
  ↓
Build
  ↓
View real progress/logs
  ↓
APK ready or actionable error
  ↓
Install / use APK
~~~

Internal implementation details behind these steps belong to developer documentation.

## Future user-facing guides

As the Builder UI and supported workflows become stable, guides may be added for:
- getting started
- supported project types
- preparing a ZIP
- starting a build
- understanding build results
- APK installation
- user-facing troubleshooting

Do not use this directory as a second engineering specification.
