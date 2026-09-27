# Documentation Map

The documentation is intentionally separated by audience.

## Developer / Internal Engineering

Use [developer/](developer/) when building, modifying, testing, or extending the Universal ZIP-to-APK Builder.

- [Developer Engineering Guide](developer/README.md)
- [Framework Build Flow Contract](developer/FRAMEWORK-BUILD-FLOW-CONTRACT.md)

Developer engineering sources remain:
- /ROADMAP.md
- /AGENTS.md
- docs/ARCHITECTURE.md
- docs/TEST-MATRIX.md
- docs/VALIDATION-WORKFLOW.md
- docs/ADR/

## End User

Use [user/](user/) when documenting how a person uses the Builder to produce an APK.

- [User Documentation](user/README.md)

## Boundary

Developer documentation answers:

**How do we build and verify the Builder itself?**

User documentation answers:

**How does a person use the Builder?**

Neither audience should be forced to read the other's internal documentation.

The developer layer is authoritative for implementation and engineering verification. The user layer is authoritative for user-facing tasks and product usage guidance.
