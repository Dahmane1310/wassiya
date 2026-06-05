import { decryptData, encryptData, type EncryptedDataPackage } from "@workspace/crypto"

// Heir names are PII, encrypted DIRECTLY with the in-memory master key (no
// per-record DEK — unlike assets), mirroring lib/vault.ts's passphrase verifier.
// Structural fields (relationship/lineage/gender/isAlive) stay plaintext so the
// Fara'id engine can read them (CLAUDE.md §4).

export const encryptHeirName = (name: string, key: CryptoKey): Promise<EncryptedDataPackage> =>
  encryptData(name, key)

export const decryptHeirName = (enc: EncryptedDataPackage, key: CryptoKey): Promise<string> =>
  decryptData(enc.ciphertext, enc.iv, key)

/** Initials for the tree/legend avatars, derived from the decrypted name. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}
