module.exports = function (api) {
  api.cache(true)
  return {
    presets: ["babel-preset-expo"],
    // react-native-reanimated v4 worklets transform. MUST be the last plugin.
    // (Uniwind needs no babel plugin — it runs as a Metro transformer.)
    plugins: ["react-native-worklets/plugin"],
  }
}
