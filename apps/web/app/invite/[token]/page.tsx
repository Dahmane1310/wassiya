import { InviteRedeem } from "@/components/invite-redeem"

// Beneficiary invite landing. The token is the raw value from the share link
// (wassiya share → https://<web>/invite/<token>); it is hashed client-side and
// only the hash reaches the server. Next 16: `params` is async.
export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-6 px-6 py-12">
      <InviteRedeem token={decodeURIComponent(token)} />
    </main>
  )
}
