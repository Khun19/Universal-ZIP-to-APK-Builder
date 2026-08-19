# Isolated Android builder

This image is the only supported place for uploaded source to execute. The API/worker must run it with a generated temporary workspace, a non-root UID, no host network, no secrets, read-only image layers, a bounded CPU/memory/pid limit, and a hard timeout. Do not mount the Docker socket into the container.

Build:

```bash
docker build -t universal-zip-to-apk/android-builder:latest docker/android-builder
```

The runtime worker must mount only the extracted project at `/workspace` and an output directory at `/output`, then validate the resulting APK before persisting its metadata.