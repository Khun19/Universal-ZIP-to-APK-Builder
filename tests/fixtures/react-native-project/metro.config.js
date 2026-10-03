const path = require('path');
const { getDefaultConfig } = require('@react-native/metro-config');

const fixtureRoot = __dirname;
const workspaceRoot = path.resolve(fixtureRoot, '../../..');
const config = getDefaultConfig(workspaceRoot);

// The tracked RN fixture is intentionally nested inside this pnpm workspace.
// Metro must have the workspace root as its project boundary so the pnpm
// symlink targets under node_modules/.pnpm remain visible to the file map.
config.watchFolders = Array.from(
  new Set([...(config.watchFolders ?? []), workspaceRoot]),
);
config.resolver.nodeModulesPaths = Array.from(
  new Set([
    path.join(fixtureRoot, 'node_modules'),
    path.join(workspaceRoot, 'node_modules'),
    ...(config.resolver.nodeModulesPaths ?? []),
  ]),
);

module.exports = config;
