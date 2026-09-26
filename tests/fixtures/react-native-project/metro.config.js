const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = mergeConfig(config, {
  // The fixture lives inside the repository workspace. Metro must be able
  // to hash packages that pnpm hoists to the workspace root.
  watchFolders: [
    path.resolve(__dirname, '../../../node_modules'),
  ],
});
