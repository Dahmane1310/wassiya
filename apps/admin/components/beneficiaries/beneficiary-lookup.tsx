"use client"

import { useMemo, useState } from "react"
import { useQuery } from "convex/react"
import { type ColumnDef } from "@tanstack/react-table"
import { type TFunction } from "i18next"
import { KeyRound } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import { DataTable, DataTableColumnHeader } from "@workspace/ui/components/data-table"
import { DebouncedInput } from "@/components/shared/debounced-input"
import { OwnerRef } from "@/components/shared/owner-ref"
import { TimeCell } from "@/components/shared/time-cell"
import { useDataTableLabels } from "@/hooks/use-data-table-labels"

type BeneficiaryRow = {
  _id: string
  _creationTime: number
  contactEmail: string
  status: string
  linked: boolean
  ownerId: string
  ownerEmail: string | null
  ownerName: string | null
  keyFingerprint: string | null
}

function buildColumns(t: TFunction): ColumnDef<BeneficiaryRow>[] {
  return [
    {
      id: "beneficiary",
      meta: { label: t("beneficiaryLookup.colBeneficiary") },
      accessorFn: (b) => b.contactEmail,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("beneficiaryLookup.colBeneficiary")} />
      ),
      cell: ({ row }) => <span className="font-medium">{row.original.contactEmail}</span>,
    },
    {
      id: "status",
      meta: { label: t("beneficiaryLookup.colStatus") },
      accessorFn: (b) => b.status,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("beneficiaryLookup.colStatus")} />
      ),
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={
            row.original.status === "enrolled"
              ? "border-transparent bg-green-600/10 text-green-700 dark:text-green-400"
              : "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400"
          }
        >
          {t(`userBeneficiaries.${row.original.status}`, { defaultValue: row.original.status })}
        </Badge>
      ),
    },
    {
      id: "signedUp",
      meta: { label: t("userBeneficiaries.signedUp") },
      accessorFn: (b) => b.linked,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("userBeneficiaries.signedUp")} />
      ),
      cell: ({ row }) =>
        row.original.linked ? (
          <Badge variant="secondary" className="border-transparent bg-green-600/10 text-green-700 dark:text-green-400">{t("common.yes")}</Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">{t("common.no")}</Badge>
        ),
    },
    {
      id: "namedBy",
      meta: { label: t("beneficiaryLookup.namedBy") },
      accessorFn: (b) => b.ownerEmail ?? b.ownerName ?? "",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("beneficiaryLookup.namedBy")} />
      ),
      cell: ({ row }) => (
        <OwnerRef
          ownerId={row.original.ownerId}
          email={row.original.ownerEmail ?? row.original.ownerName}
        />
      ),
    },
    {
      id: "named",
      meta: { label: t("beneficiaryLookup.colNamed") },
      accessorFn: (b) => b._creationTime,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("beneficiaryLookup.colNamed")} />
      ),
      cell: ({ row }) => <TimeCell ts={row.original._creationTime} />,
    },
    {
      id: "fingerprint",
      meta: { label: t("beneficiaryLookup.fingerprint") },
      accessorFn: (b) => b.keyFingerprint ?? "",
      enableSorting: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("beneficiaryLookup.fingerprint")} />
      ),
      cell: ({ row }) =>
        row.original.keyFingerprint === null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span
            className="inline-flex max-w-56 items-center gap-1.5"
            title={row.original.keyFingerprint}
          >
            <KeyRound className="text-primary size-3.5 shrink-0" />
            <span className="truncate font-mono text-xs">{row.original.keyFingerprint}</span>
          </span>
        ),
    },
  ]
}

/** Support lookup: a beneficiary's email → who named them, enrollment state and
 *  their key fingerprint (for verification calls). The table shell is always
 *  visible; the empty state prompts for an email until one is entered. */
export function BeneficiaryLookup() {
  const { t } = useTranslation()
  const labels = useDataTableLabels()
  const columns = useMemo(() => buildColumns(t), [t])
  const [email, setEmail] = useState("")
  const searching = email.trim() !== ""
  const results = useQuery(
    api.admin.beneficiaries.searchBeneficiaries,
    searching ? { email } : "skip",
  )

  return (
    <DataTable
      columns={columns}
      data={results ?? []}
      labels={{
        ...labels,
        noResults: searching
          ? t("beneficiaryLookup.noResult", { email: email.trim() })
          : t("beneficiaryLookup.intro"),
      }}
      viewOptions
      exportName="beneficiaries"
      loading={searching && results === undefined}
      toolbar={
        <DebouncedInput
          value={email}
          onChange={setEmail}
          placeholder={t("beneficiaryLookup.placeholder")}
          className="w-72"
        />
      }
    />
  )
}
