// Auto-lock suppression for INTENTIONAL system excursions (image/document pickers,
// share sheets, permission dialogs). These background the app — especially on
// Android, where a picker is a separate Activity — which would otherwise trip the
// background auto-lock (hooks/use-auto-lock.ts) and re-prompt for the PIN mid-flow.
//
// Wrap such a call in `withoutAutoLock(() => picker())`: auto-lock is suppressed for
// the round-trip plus a short tail so the "background"→"active" transition settles
// before re-arming. The vault key stays in memory only; this never persists anything.

let suppressed = 0

export function isAutoLockSuppressed(): boolean {
  return suppressed > 0
}

/** Run `fn` (a picker / share / permission call) with background auto-lock suppressed. */
export async function withoutAutoLock<T>(fn: () => Promise<T>): Promise<T> {
  suppressed++
  try {
    return await fn()
  } finally {
    // Keep suppression briefly past the await: returning to the app fires an
    // "active" AppState change, and on some platforms a trailing "background"
    // event can arrive just after — wait for it to pass before re-arming.
    setTimeout(() => {
      suppressed = Math.max(0, suppressed - 1)
    }, 800)
  }
}
