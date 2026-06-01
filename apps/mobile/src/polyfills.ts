// WebCrypto polyfill for the WorkOS PKCE flow. Must run before any code that
// touches `crypto.subtle` — see index.ts.
//
// `polyfillWebCrypto()` installs `crypto.getRandomValues` but NOT
// `crypto.subtle`. WorkOS's PKCE needs `crypto.subtle.digest` (SHA-256 of the
// code verifier), so we patch just that method using expo-crypto. (Mirrors the
// official workos/expo-authkit-example polyfill.)
import { digest } from "expo-crypto"
import { polyfillWebCrypto } from "expo-standard-web-crypto"

polyfillWebCrypto()

if (!globalThis.crypto.subtle) {
  const cryptoObj = globalThis.crypto as unknown as { subtle: SubtleCrypto }
  cryptoObj.subtle = { digest } as unknown as SubtleCrypto
}
