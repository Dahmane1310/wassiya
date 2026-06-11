"use client"

import { useTranslation } from "react-i18next"
import { type DataTableLabels } from "@workspace/ui/components/data-table"

/** Localized DataTable chrome strings — pass as `labels={useDataTableLabels()}`. */
export function useDataTableLabels(): DataTableLabels {
  const { t } = useTranslation()
  return {
    columns: t("table.columns"),
    toggleColumns: t("table.toggleColumns"),
    export: t("table.export"),
    exportTitle: t("table.exportTitle"),
    rowsPerPage: t("table.rowsPerPage"),
    noResults: t("table.noResults"),
    loading: t("common.loading"),
    moreOnServer: t("table.moreOnServer"),
    rowsLoaded: (count) => t("table.rowsLoaded", { count }),
    pageOf: (page, count, more) =>
      t("table.pageOf", { page, count: `${count}${more ? "+" : ""}` }),
  }
}
