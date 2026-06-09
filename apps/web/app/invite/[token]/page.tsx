import { InviteRedeem } from "@/components/invite-redeem"

// Beneficiary invite landing. The token is the raw value from the share link
// (mobile share → https://<web>/invite/<token>); it is hashed client-side and only
// the hash reaches the server. Next 16: `params` is async. InviteRedeem owns its
// own full-screen layout (sign-in panel / enrollment wizard).
export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return <InviteRedeem token={decodeURIComponent(token)} />
}
