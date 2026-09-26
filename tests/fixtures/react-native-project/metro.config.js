const fs = require('fs');
const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

function findWorkspaceNodeModules() {
  let current = __dirname;

  for (let depth = 0; depth < 8; depth += 1) {
    if (fs.existsSync(path.join(current, 'pnpm-workspace.yaml'))) {
      return path.join(current, 'node_modules');
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return path.join(__dirname, 'node_modules');
}

const config = getDefaultConfig(__dirname);

module.exports = mergeConfig(config, {
  // The tracked fixture is nested inside the pnpm workspace, while the
  // builder integration extracts it as a standalone project. Resolve the
  // workspace root dynamically so the extracted project never points outside
  // its own sandbox.
  watchFolders: [
    findWorkspaceNodeModules(),
  ],
});
