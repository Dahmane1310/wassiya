// Expo's Metro config auto-detects the pnpm workspace root and resolves hoisted
// node_modules — no manual watchFolders/nodeModulesPaths needed on SDK 52+.
const { getDefaultConfig } = require("expo/metro-config")
const { withUniwindConfig } = require("uniwind/metro")

const config = getDefaultConfig(__dirname)

// `@workspace/backend` exposes its API only through the package `exports` field
// (./api, ./dataModel). Ensure Metro honors package exports so that import
// resolves. (Default-on in SDK 56, set explicitly as a safeguard.)
config.resolver.unstable_enablePackageExports = true

// Uniwind (Tailwind v4 for React Native). withUniwindConfig MUST be the
// outermost wrapper. `@source` inside global.css covers the shared
// `@workspace/ui-native` package so its class names aren't purged.
module.exports = withUniwindConfig(config, {
  cssEntryFile: "./src/global.css",
  dtsFile: "./src/uniwind-types.d.ts",
})
