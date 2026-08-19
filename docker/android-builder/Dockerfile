FROM ghcr.io/cirruslabs/android-sdk:34

ENV DEBIAN_FRONTEND=noninteractive \
    NODE_VERSION=20 \
    GRADLE_USER_HOME=/tmp/gradle

RUN apt-get update && apt-get install -y --no-install-recommends curl unzip git ca-certificates \
  && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && npm install --global pnpm @capacitor/cli \
  && useradd --create-home --uid 10001 builder \
  && rm -rf /var/lib/apt/lists/*

USER builder
WORKDIR /workspace
ENTRYPOINT ["node", "/opt/worker/run-build.mjs"]