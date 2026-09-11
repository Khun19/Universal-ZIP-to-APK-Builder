# Templates

This document describes the Template System used by Universal ZIP → APK Builder.

## Registry

The template registry is located at `templates/registry.json` and lists available templates. Each entry contains:

- id: unique identifier (lowercase letters, numbers, - and _ only)
- name
- version
- category
- description
- framework
- buildStrategy
- requiredTools
- path: relative path to the template folder in the repository

The registry is validated at load time.

## Template structure

Each template resides under `templates/<id>/` and contains the starter project files. Files can use the following placeholders which will be replaced during generation:

- `{{PROJECT_NAME}}` - the short project name
- `{{APP_NAME}}` - the human-friendly app name
- `{{PACKAGE_NAME}}` - the Android package name (for Android templates)

Only text files are variable-substituted. Binary files are copied verbatim.

## Security

- Template IDs are validated to `/^[a-z0-9\-_]+$/`.
- Project names cannot contain path separators and are restricted to a safe character set.
- Android package names must be at least two dot-separated segments and each segment must match `/^[a-z][a-z0-9_]*$/`.
- Path traversal is prevented by resolving destination paths and ensuring they remain inside the generated workspace.
- Template generation does not execute any scripts from templates.

## Generation

API: `POST /api/templates/:id/generate` with JSON body `{ "projectName": "myproj", "appName": "My App", "packageName": "com.example.app" }`.

CLI: `pnpm tsx lib/cli.ts templates:create <id> <projectName> [--app-name=] [--package=]`

After generation the server will run the repository's existing analysis -> strategy -> build pipeline on the created project. The generated project is placed under `.workspace/template-<id>-<ts>-<name>`.

## Adding a new template

1. Add a directory under `templates/<id>` with the starter files.
2. Add an entry in `templates/registry.json` describing the template.
3. Add tests under `tests/` to validate generation if desired.

## Notes

- For templates that require a Node build step (React/Vite), the builder will attempt to run the normal web build process. The builder will fail if the required toolchain (node, pnpm/npm) is not available; this is expected and matches existing behavior.
- Native Android templates must include a Gradle `settings.gradle` and an `app/` module so the existing Gradle-based build pipeline can run.
