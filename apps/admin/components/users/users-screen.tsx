"use client"

import { useTranslation } from "react-i18next"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { BeneficiaryLookup } from "./beneficiary-lookup"
import { UserSearch } from "./user-search"
import { UsersTable } from "./users-table"

export function UsersScreen() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{t("users.title")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("users.subtitle")}
        </p>
      </div>
      <Tabs defaultValue="owners">
        <TabsList>
          <TabsTrigger value="owners">{t("users.tabOwners")}</TabsTrigger>
          <TabsTrigger value="beneficiaries">{t("users.tabBeneficiaries")}</TabsTrigger>
        </TabsList>
        <TabsContent value="owners">
          <UsersTable toolbar={<UserSearch />} />
        </TabsContent>
        <TabsContent value="beneficiaries">
          <BeneficiaryLookup />
        </TabsContent>
      </Tabs>
    </div>
  )
}
