"use client"

/** Centered single-column shell for the invite/enroll moments. */
export function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-6 py-10"
      style={{
        background:
          "radial-gradient(900px 600px at 50% -10%, var(--gold-soft), transparent 55%), var(--bg)",
      }}
    >
      <div className="w-up w-[460px] max-w-full">{children}</div>
    </div>
  )
}
