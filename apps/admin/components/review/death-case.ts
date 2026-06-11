import { type Id } from "@workspace/backend/dataModel"

/** A row from api.admin.deathCases.listCases. */
export type DeathCase = {
  _id: Id<"deathVerification">
  _creationTime: number
  ownerId: string
  ownerEmail: string | null
  status: string
  submittedAt: number
  dateOfDeath: number | null
  submitterRole: string | null
  submittedByKind: string | null
  submittedByEmail: string | null
  hasCertificate: boolean
  reviewedBy: string | null
  reviewedAt: number | null
  reviewNotes: string | null
  switchState: string | null
  lastCheckInAt: number | null
}

/** The owner checked in AFTER the report was filed — they may be alive. */
export function aliveSignal(c: DeathCase): boolean {
  return c.lastCheckInAt !== null && c.lastCheckInAt > c.submittedAt
}
