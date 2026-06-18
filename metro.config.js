const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable package.json "exports" field resolution (needed for react-dom/client)
config.resolver.unstable_enablePackageExports = true;

// Cap Metro's worker pool. On newer Node versions the bundler's multi-process
// workers can crash during a cold bundle with "Data cannot be cloned, out of
// memory" — an IPC serialization failure between worker processes. Fewer
// workers means smaller messages over that channel and avoids the crash.
config.maxWorkers = 2;

module.exports = config;
