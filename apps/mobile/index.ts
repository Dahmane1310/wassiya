// IMPORTANT: the WebCrypto polyfill must run before any other code so that
// `@workos-inc/node`'s PKCE helpers can use `crypto.subtle`. Keep this first.
import "./polyfills"

// react-native-gesture-handler must be imported before any other app code so
// its native module is registered (used by @rn-primitives overlays).
import "react-native-gesture-handler"

import "expo-router/entry"
