import { useMutation } from "convex/react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { type EncryptedDataPackage } from "@workspace/crypto"
import {
  clearBiometricPassphrase,
  readBiometricPassphrase,
  storeBiometricPassphrase,
} from "@/lib/biometric"
import {
  createVault,
  verifyPassphrase,
  WrongPassphraseError,
} from "@/lib/vault"
import { usePreferences } from "@/stores/preferences"
import { useVaultStore } from "@/stores/vault"

/**
 * Wires the pure vault crypto (`lib/vault`) + biometric keystore (`lib/biometric`)
 * to the Convex mutation and the in-memory session store. Navigation is owned by
 * the SCREENS (so they can insert a biometric-enroll step after a successful
 * passphrase entry). The master key never leaves the device.
 */
export function useVault() {
  const { t } = useTranslation()
  const completeVaultSetup = useMutation(api.vault.completeVaultSetup)
  const setUnlocked = useVaultStore((s) => s.setUnlocked)
  const lock = useVaultStore((s) => s.lock)
  const setBiometricEnabled = usePreferences((s) => s.setBiometricEnabled)

  /** Two-Step onboarding. Holds the key on "created"; "exists" = a salt mismatch
   *  (reinstall / 2nd-device race) — caller routes to unlock. No navigation. */
  async function setupVault(passphrase: string): Promise<"created" | "exists"> {
    const { salt, verifier, key } = await createVault(passphrase)
    const stored = await completeVaultSetup({
      vaultSalt: salt,
      passphraseVerifier: verifier,
    })
    if (stored.vaultSalt !== salt) {
      return "exists"
    }
    setUnlocked(key)
    return "created"
  }

  /** Returning-user unlock. Holds the key; throws WrongPassphraseError on a bad
   *  passphrase (the caller shows the error). No navigation. */
  async function unlock(
    passphrase: string,
    salt: string,
    verifier: EncryptedDataPackage
  ): Promise<void> {
    const key = await verifyPassphrase(passphrase, salt, verifier)
    setUnlocked(key)
  }

  /** Store the passphrase in the biometric-gated keystore for future unlocks. */
  async function enableBiometric(passphrase: string): Promise<void> {
    await storeBiometricPassphrase(passphrase, t("biometric.savePrompt"))
    setBiometricEnabled(true)
  }

  /** Remove the biometric secret + flag. */
  async function disableBiometric(): Promise<void> {
    await clearBiometricPassphrase()
    setBiometricEnabled(false)
  }

  /**
   * Unlock via biometrics. Returns false (caller falls back to the passphrase) if
   * the prompt is cancelled or the keystore was invalidated by a biometric change.
   * If the stored secret no longer verifies (stale), disables biometric.
   */
  async function unlockWithBiometric(
    salt: string,
    verifier: EncryptedDataPackage
  ): Promise<boolean> {
    const passphrase = await readBiometricPassphrase(
      t("biometric.unlockPrompt")
    )
    if (passphrase === null) {
      return false
    }
    try {
      const key = await verifyPassphrase(passphrase, salt, verifier)
      setUnlocked(key)
      return true
    } catch (err) {
      if (err instanceof WrongPassphraseError) {
        await disableBiometric()
        return false
      }
      throw err
    }
  }

  return {
    setupVault,
    unlock,
    lock,
    enableBiometric,
    disableBiometric,
    unlockWithBiometric,
  }
}
