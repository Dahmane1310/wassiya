"use client"

import { useTranslation } from "react-i18next"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { PendingTable } from "./pending-table"
import { ReleasedTable } from "./released-table"

export function ReleasesScreen() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{t("releases.title")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("releases.subtitle")}
        </p>
      </div>
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">{t("releases.tabPending")}</TabsTrigger>
          <TabsTrigger value="released">{t("releases.tabReleased")}</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <PendingTable />
        </TabsContent>
        <TabsContent value="released">
          <ReleasedTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
