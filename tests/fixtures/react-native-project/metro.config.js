const path = require('path');
const { getDefaultConfig } = require('@react-native/metro-config');

const config = getDefaultConfig(__dirname);

// This fixture is intentionally nested inside the builder's pnpm workspace.
// pnpm hoists the installed package targets into the workspace root, which is
// outside this React Native project's projectRoot. Metro requires those
// external dependency targets to be visible through watchFolders.
const workspaceNodeModules = path.resolve(__dirname, '../../..', 'node_modules');

config.watchFolders = Array.from(
  new Set([...(config.watchFolders ?? []), workspaceNodeModules]),
);
config.resolver.nodeModulesPaths = Array.from(
  new Set([...(config.resolver.nodeModulesPaths ?? []), workspaceNodeModules]),
);

module.exports = config;
