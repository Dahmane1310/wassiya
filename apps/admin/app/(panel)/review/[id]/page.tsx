import { CaseScreen } from "@/components/review/case-screen"

export default async function CasePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <CaseScreen caseId={id} />
}
