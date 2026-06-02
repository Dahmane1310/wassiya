// WebCrypto polyfill for the WorkOS PKCE flow. Must run before any code that
// touches `crypto.subtle` — see index.ts.
//
// `polyfillWebCrypto()` installs `crypto.getRandomValues` but NOT
// `crypto.subtle`. WorkOS's PKCE needs `crypto.subtle.digest` (SHA-256 of the
// code verifier), so we patch just that method using expo-crypto. (Mirrors the
// official workos/expo-authkit-example polyfill.)
import { digest } from "expo-crypto"
import { polyfillWebCrypto } from "expo-standard-web-crypto"
import QuickCrypto from "react-native-quick-crypto"
import { configureCrypto, type CryptoProvider } from "@workspace/crypto"

polyfillWebCrypto()

if (!globalThis.crypto.subtle) {
  const cryptoObj = globalThis.crypto as unknown as { subtle: SubtleCrypto }
  cryptoObj.subtle = { digest } as unknown as SubtleCrypto
}

// `@workspace/crypto` needs a full WebCrypto `subtle` (PBKDF2 deriveBits +
// AES-GCM), which the digest-only patch above does not provide on Hermes. We
// hand it react-native-quick-crypto's native-backed implementation directly,
// rather than via `globalThis.crypto`, so the WorkOS PKCE patch above is left
// untouched. (QuickCrypto's default export exposes both `subtle` and
// `getRandomValues` at the top level.)
configureCrypto(QuickCrypto as unknown as CryptoProvider)
