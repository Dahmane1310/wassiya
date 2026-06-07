import {
  decryptData,
  encryptData,
  generateInviteToken,
  sha256,
  type EncryptedDataPackage,
} from "@workspace/crypto"

// Invite tokens are generated on THIS device, hashed, and only the hash is sent
// to the backend. The raw token is shared out-of-band (the owner sends the link);
// it never touches the server. The owner's private label for a contact is
// encrypted with the master key (like heir names / the vault verifier).

export const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000

export const encryptLabel = (label: string, key: CryptoKey): Promise<EncryptedDataPackage> =>
  encryptData(label, key)

export const decryptLabel = (enc: EncryptedDataPackage, key: CryptoKey): Promise<string> =>
  decryptData(enc.ciphertext, enc.iv, key)

/** A fresh invite: the raw token (to share) + its hash (to store). */
export async function newInvite(): Promise<{ token: string; tokenHash: string; expiresAt: number }> {
  const token = generateInviteToken()
  const tokenHash = await sha256(token)
  return { token, tokenHash, expiresAt: Date.now() + INVITE_TTL_MS }
}

// Beneficiaries enroll + redeem on the WEB release portal (not the mobile app), so
// the shared link is an https URL, not the `wassiya://` scheme. Configurable per
// environment; falls back to the production host.
const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? "https://wassiya.app"

/** The link the owner shares; the recipient opens it in a browser to redeem. */
export const inviteLink = (token: string) =>
  `${WEB_URL}/invite/${encodeURIComponent(token)}`
