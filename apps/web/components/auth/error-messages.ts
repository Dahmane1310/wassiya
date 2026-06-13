// Maps the safe error codes auth-actions returns to i18n KEYS
// (locales/*.json "auth.errors" section) — callers render them with t().
const MESSAGE_KEYS: Record<string, string> = {
  invalid_credentials: "auth.errors.invalidCredentials",
  user_not_found: "auth.errors.userNotFound",
  invalid_one_time_code: "auth.errors.invalidCode",
  magic_auth_code_expired: "auth.errors.codeExpired",
  email_verification_code_expired: "auth.errors.codeExpired",
  password_strength_error: "auth.errors.passwordStrength",
  user_creation_error: "auth.errors.userCreation",
  password_reset_token_expired: "auth.errors.resetExpired",
  auth_failed: "auth.errors.authFailed",
}

/** Returns an i18n KEY for the given auth error code. */
export function friendlyAuthErrorKey(code: string): string {
  return MESSAGE_KEYS[code] ?? MESSAGE_KEYS.auth_failed!
}
