import { useMutation } from "convex/react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { base64ToBytes, bytesToBase64 } from "@workspace/crypto"
import {
  clearBiometricMasterKey,
  readBiometricMasterKey,
  storeBiometricMasterKey,
} from "@/lib/biometric"
import {
  clearPinWrap,
  readPinWrap,
  storePinWrap,
} from "@/lib/pin-store"
import {
  createVault,
  importMasterKey,
  unwrapWithPin,
  unwrapWithRecovery,
  wrapMkForPin,
  WrongPinError,
} from "@/lib/vault"
import { currentAccountId } from "@/stores/auth"
import { usePreferences } from "@/stores/preferences"
import { useVaultStore } from "@/stores/vault"

/** The server recovery wrap needed to rebuild the master key on a new device. */
type RecoveryWrap = {
  recoverySalt: string
  recoveryWrappedKey: string
  recoveryWrapIv: string
}

function requireAccountId(): string {
  const id = currentAccountId()
  if (!id) throw new Error("Not authenticated")
  return id
}

/**
 * Wires the pure vault crypto (`lib/vault`) + the device key stores (`lib/pin-store`,
 * `lib/biometric`) to the Convex mutation and the in-memory session. Navigation is
 * owned by the SCREENS (so they can insert a "show recovery key" / biometric-enroll
 * step while the raw master-key bytes are still in hand). The master key + PIN never
 * leave the device; only the recovery wrap reaches the server.
 */
export function useVault() {
  const { t } = useTranslation()
  const completeVaultSetup = useMutation(api.vault.completeVaultSetup)
  const setUnlocked = useVaultStore((s) => s.setUnlocked)
  const lock = useVaultStore((s) => s.lock)
  const setBiometricEnabled = usePreferences((s) => s.setBiometricEnabled)
  const bumpPinAttempts = usePreferences((s) => s.bumpPinAttempts)
  const resetPinAttempts = usePreferences((s) => s.resetPinAttempts)

  /**
   * Onboarding. Mints a random master key, stores the device PIN wrap, persists the
   * recovery wrap on the server, and unlocks. Returns the one-time Recovery Key + the
   * raw master-key bytes (caller shows the key, optionally enrolls biometric, then
   * zeroes the bytes). "exists" = a vault is already on the server with a different
   * master key (reinstall / 2nd device) → caller routes to recovery.
   */
  async function setupVault(
    pin: string
  ): Promise<
    | { status: "created"; recoveryCode: string; mkBytes: Uint8Array<ArrayBuffer> }
    | { status: "exists" }
  > {
    const accountId = requireAccountId()
    const { key, mkBytes, pinWrap, recovery, recoveryCode } =
      await createVault(pin)
    const stored = await completeVaultSetup({
      recoverySalt: recovery.recoverySalt,
      recoveryWrappedKey: recovery.recoveryWrappedKey,
      recoveryWrapIv: recovery.recoveryWrapIv,
      vaultVerifier: recovery.verifier,
    })
    // A row already existed (its recovery wrap is for a DIFFERENT master key) — our
    // freshly-minted key would decrypt nothing. Discard it and route to recovery.
    if (stored.recoveryWrappedKey !== recovery.recoveryWrappedKey) {
      mkBytes.fill(0)
      return { status: "exists" }
    }
    await storePinWrap(accountId, pinWrap)
    setUnlocked(key)
    return { status: "created", recoveryCode, mkBytes }
  }

  /**
   * Daily unlock via the device PIN — fully local, no server call. Throws
   * WrongPinError on a bad PIN (the caller shows the error). Returns the raw
   * master-key bytes so the caller can offer biometric enrolment; zero them after.
   */
  async function unlock(pin: string): Promise<{ mkBytes: Uint8Array<ArrayBuffer> }> {
    const accountId = requireAccountId()
    const pinWrap = await readPinWrap(accountId)
    if (!pinWrap) throw new Error("No PIN set on this device")
    try {
      const { key, mkBytes } = await unwrapWithPin(pin, pinWrap)
      setUnlocked(key)
      resetPinAttempts(accountId)
      return { mkBytes }
    } catch (err) {
      if (err instanceof WrongPinError) bumpPinAttempts(accountId)
      throw err
    }
  }

  /**
   * New-device / forgotten-PIN recovery: unwrap the master key with the Recovery Key,
   * set a NEW local PIN, and unlock. Throws WrongRecoveryKeyError on a bad code.
   * Returns the raw bytes for optional biometric enrolment; zero them after.
   */
  async function recoverWithKey(
    recoveryCode: string,
    newPin: string,
    recovery: RecoveryWrap
  ): Promise<{ mkBytes: Uint8Array<ArrayBuffer> }> {
    const accountId = requireAccountId()
    const { key, mkBytes } = await unwrapWithRecovery(recoveryCode, recovery)
    const pinWrap = await wrapMkForPin(mkBytes, newPin)
    await storePinWrap(accountId, pinWrap)
    setUnlocked(key)
    resetPinAttempts(accountId)
    return { mkBytes }
  }

  /** Change the device PIN: unwrap with the old PIN, re-wrap under the new one. The
   *  master key is invariant, so biometric + server recovery stay coherent. */
  async function changePin(oldPin: string, newPin: string): Promise<void> {
    const accountId = requireAccountId()
    const pinWrap = await readPinWrap(accountId)
    if (!pinWrap) throw new Error("No PIN set on this device")
    const { mkBytes } = await unwrapWithPin(oldPin, pinWrap) // throws WrongPinError
    try {
      await storePinWrap(accountId, await wrapMkForPin(mkBytes, newPin))
      resetPinAttempts(accountId)
    } finally {
      mkBytes.fill(0)
    }
  }

  /** Store the raw master key behind the biometric gate for one-touch unlocks. */
  async function enableBiometric(
    mkBytes: Uint8Array<ArrayBuffer>
  ): Promise<void> {
    const accountId = requireAccountId()
    await storeBiometricMasterKey(
      accountId,
      bytesToBase64(mkBytes),
      t("biometric.savePrompt")
    )
    setBiometricEnabled(accountId, true)
  }

  /** Remove the biometric key + flag for this account on this device. */
  async function disableBiometric(): Promise<void> {
    const accountId = requireAccountId()
    await clearBiometricMasterKey(accountId)
    setBiometricEnabled(accountId, false)
  }

  /**
   * Unlock via biometrics — reads the raw master key back from the keystore and
   * imports it (no PBKDF2, no server). Returns false (caller falls back to the PIN)
   * if the prompt is cancelled or the key was invalidated by a biometric change.
   */
  async function unlockWithBiometric(): Promise<boolean> {
    const accountId = requireAccountId()
    const base64 = await readBiometricMasterKey(
      accountId,
      t("biometric.unlockPrompt")
    )
    if (base64 === null) return false
    const mkBytes = base64ToBytes(base64)
    try {
      const key = await importMasterKey(mkBytes)
      setUnlocked(key)
      resetPinAttempts(accountId)
      return true
    } finally {
      mkBytes.fill(0)
    }
  }

  return {
    setupVault,
    unlock,
    recoverWithKey,
    changePin,
    lock,
    enableBiometric,
    disableBiometric,
    unlockWithBiometric,
  }
}
