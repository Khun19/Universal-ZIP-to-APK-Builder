const fs = require('fs');
const path = require('path');
const { getDefaultConfig } = require('@react-native/metro-config');

const fixtureRoot = __dirname;
const workspaceRoot = path.resolve(fixtureRoot, '../../..');

function collectPnpmSymlinkTargets(startNodeModules) {
  const targets = new Set();
  const queue = [startNodeModules];
  const visitedNodeModules = new Set();

  while (queue.length > 0) {
    const nodeModulesDir = queue.shift();
    if (!nodeModulesDir || visitedNodeModules.has(nodeModulesDir)) continue;
    visitedNodeModules.add(nodeModulesDir);

    let entries;
    try {
      entries = fs.readdirSync(nodeModulesDir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const entryPath = path.join(nodeModulesDir, entry.name);

      if (entry.name.startsWith('.')) continue;

      if (entry.name.startsWith('@') && entry.isDirectory()) {
        let scopedEntries;
        try {
          scopedEntries = fs.readdirSync(entryPath, { withFileTypes: true });
        } catch {
          continue;
        }
        for (const scopedEntry of scopedEntries) {
          const scopedPath = path.join(entryPath, scopedEntry.name);
          if (!scopedEntry.isSymbolicLink()) continue;

          let target;
          try {
            target = fs.realpathSync(scopedPath);
          } catch {
            continue;
          }

          targets.add(target);
          const nestedNodeModules = path.join(target, 'node_modules');
          if (fs.existsSync(nestedNodeModules)) queue.push(nestedNodeModules);
        }
        continue;
      }

      if (!entry.isSymbolicLink()) continue;

      let target;
      try {
        target = fs.realpathSync(entryPath);
      } catch {
        continue;
      }

      targets.add(target);
      const nestedNodeModules = path.join(target, 'node_modules');
      if (fs.existsSync(nestedNodeModules)) queue.push(nestedNodeModules);
    }
  }

  return [...targets].sort();
}

const config = getDefaultConfig(fixtureRoot);

// pnpm's workspace node_modules contains symlinks whose real targets live in
// node_modules/.pnpm. Metro 0.81 can follow those symlinks, but the real
// target directories must be visible to its file map. Watching the entire
// workspace root fixes visibility but is too broad for Termux and can exhaust
// inotify watchers. Instead, expose only the dependency graph reachable from
// this fixture's node_modules symlinks.
const dependencyWatchFolders = collectPnpmSymlinkTargets(
  path.join(fixtureRoot, 'node_modules'),
);

config.watchFolders = Array.from(
  new Set([...(config.watchFolders ?? []), ...dependencyWatchFolders]),
);
config.resolver.nodeModulesPaths = Array.from(
  new Set([
    path.join(fixtureRoot, 'node_modules'),
    path.join(workspaceRoot, 'node_modules'),
    ...(config.resolver.nodeModulesPaths ?? []),
  ]),
);
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
