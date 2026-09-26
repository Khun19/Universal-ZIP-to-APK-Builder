# Termux Bridge — Layer 1 ↔ Layer 2

The bridge is the local contract between the Android Builder UI and Termux.

Responsibilities:
- discover the Termux Builder environment;
- invoke the Builder CLI safely;
- pass paths/arguments without shell interpolation;
- stream real status and logs;
- return structured build and artifact results.

The bridge is not a second build engine. Build semantics remain in Layer 3.
