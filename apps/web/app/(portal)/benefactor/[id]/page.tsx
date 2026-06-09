import { BenefactorDetail } from "@/components/portal/benefactor-detail"

export default async function BenefactorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <BenefactorDetail id={id} />
}
