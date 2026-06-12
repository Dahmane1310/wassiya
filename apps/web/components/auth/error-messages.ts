// Plain-language messages for the safe error codes auth-actions returns.
const MESSAGES: Record<string, string> = {
  invalid_credentials: "That email or password doesn't match.",
  user_not_found: "We couldn't find an account with that email.",
  invalid_one_time_code: "That code doesn't match — check it and try again.",
  magic_auth_code_expired: "That code has expired — send a new one.",
  email_verification_code_expired: "That code has expired — send a new one.",
  password_strength_error: "Please pick a stronger password — longer is better.",
  user_creation_error: "We couldn't create the account — that email may already be in use.",
  password_reset_token_expired: "That reset link has expired — request a new one.",
  auth_failed: "Something went wrong. Please try again.",
}

export function friendlyAuthError(code: string): string {
  return MESSAGES[code] ?? MESSAGES.auth_failed!
}
