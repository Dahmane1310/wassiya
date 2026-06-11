import { UserDetailScreen } from "@/components/users/user-detail-screen"

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // The param is the bare WorkOS subject ("user_…") — the detail query expands
  // it against the issuer. decodeURIComponent keeps old full-id links working.
  return <UserDetailScreen tokenIdentifier={decodeURIComponent(id)} />
}
