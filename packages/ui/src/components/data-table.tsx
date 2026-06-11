"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type RowData,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsUpDown,
  Download,
  Loader2,
  Search,
  SearchX,
  Settings2,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { cn } from "@workspace/ui/lib/utils"

// The shadcn "Data Table" pattern (TanStack Table v8 over the Table primitives),
// extended for cursor-paginated backends (Convex usePaginatedQuery): the pager
// pages CLIENT-SIDE over the rows loaded so far and transparently fetches the
// next server page when stepping past the loaded boundary. Sorting lives in the
// column headers only — `serverSort` binds one (time) column's arrows to the
// backend's index order so pagination keeps fetching in the right direction;
// every other column sorts client-side over loaded rows.

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Human label for the column-visibility dropdown. */
    label?: string
  }
}

/** Sortable header: pass as `header: ({ column }) => <DataTableColumnHeader …/>`. */
function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: {
  column: Column<TData, TValue>
  title: string
  className?: string
}) {
  if (!column.getCanSort()) {
    return <span className={className}>{title}</span>
  }
  const sorted = column.getIsSorted()
  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(sorted === "asc")}
      className={cn(
        "group -ms-1 inline-flex select-none items-center gap-1 rounded-md px-1 py-0.5",
        "text-muted-foreground hover:text-foreground transition-colors",
        sorted && "text-foreground",
        className,
      )}
    >
      {title}
      {sorted === "asc" ? (
        <ArrowUp className="text-primary size-3.5" />
      ) : sorted === "desc" ? (
        <ArrowDown className="text-primary size-3.5" />
      ) : (
        <ChevronsUpDown className="size-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
      )}
    </button>
  )
}

/** Wire-up for cursor pagination (e.g. Convex usePaginatedQuery). */
export type DataTableServerState = {
  status: "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted"
  loadMore: (numItems: number) => void
}

/** Chrome strings — override for i18n (defaults are English). */
export type DataTableLabels = {
  columns: string
  toggleColumns: string
  export: string
  exportTitle: string
  rowsPerPage: string
  noResults: string
  loading: string
  moreOnServer: string
  /** e.g. (3, false) → "3 rows loaded" */
  rowsLoaded: (count: number) => string
  /** e.g. (2, 5, true) → "Page 2 of 5+" */
  pageOf: (page: number, count: number, more: boolean) => string
}

const DEFAULT_LABELS: DataTableLabels = {
  columns: "Columns",
  toggleColumns: "Toggle columns",
  export: "Export",
  exportTitle: "Download the loaded rows as CSV",
  rowsPerPage: "Rows per page",
  noResults: "No results",
  loading: "Loading…",
  moreOnServer: "more on server",
  rowsLoaded: (count) => `${count} row${count === 1 ? "" : "s"} loaded`,
  pageOf: (page, count, more) => `Page ${page} of ${count}${more ? "+" : ""}`,
}

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  /** Row click handler (cells can stopPropagation for inner links/buttons). */
  onRowClick?: (row: TData) => void
  /** Cursor-pagination bridge: stepping past loaded rows fetches the next page. */
  server?: DataTableServerState
  /** Binds this column's header arrows to the BACKEND's index order. */
  serverSort?: { columnId: string; onChange: (order: "asc" | "desc") => void }
  /** Server-side controls (search inputs, filter selects) — rendered in the card's toolbar. */
  toolbar?: React.ReactNode
  /** Show the column-visibility dropdown. */
  viewOptions?: boolean
  /** Client-side quick search across all visible cell values (small tables). */
  clientSearch?: string
  /** First page still loading — renders skeleton rows inside the chrome. */
  loading?: boolean
  /** Enables CSV download of the LOADED rows; used as the filename stem. */
  exportName?: string
  /** Chrome strings (i18n) — merged over English defaults. */
  labels?: Partial<DataTableLabels>
  pageSize?: number
  className?: string
}

const PAGE_SIZES = [10, 25, 50, 100]

function csvCell(value: unknown): string {
  const s =
    value === null || value === undefined
      ? ""
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value)
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
}

function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  server,
  serverSort,
  toolbar,
  viewOptions = false,
  clientSearch,
  loading = false,
  exportName,
  labels: labelOverrides,
  pageSize: initialPageSize = 25,
  className,
}: DataTableProps<TData, TValue>) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides }
  const [sorting, setSorting] = React.useState<SortingState>(
    serverSort ? [{ id: serverSort.columnId, desc: true }] : [],
  )
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  })
  // Set when the user asked for the next page before the server delivered it.
  const pendingAdvance = React.useRef(false)

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, globalFilter, pagination },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
  })

  const pageCount = table.getPageCount()
  const { pageIndex } = table.getState().pagination
  const canLoadMore = server?.status === "CanLoadMore"
  const loadingMore = server?.status === "LoadingMore"
  const visibleColumnCount = table.getVisibleLeafColumns().length || columns.length

  // The bound (time) column's arrows drive the server's index order, so paging
  // past loaded rows continues fetching in the direction on screen.
  const onServerOrderChange = serverSort?.onChange
  const serverSortColumnId = serverSort?.columnId
  React.useEffect(() => {
    if (serverSortColumnId === undefined || onServerOrderChange === undefined) return
    const top = sorting[0]
    if (top?.id === serverSortColumnId) {
      onServerOrderChange(top.desc ? "desc" : "asc")
    }
  }, [sorting, serverSortColumnId, onServerOrderChange])

  // When new server rows arrive after a boundary click, advance onto them.
  React.useEffect(() => {
    if (pendingAdvance.current && table.getCanNextPage()) {
      pendingAdvance.current = false
      table.nextPage()
    }
  }, [data.length, table])

  // Filters/order changed upstream and the loaded set shrank → clamp the page.
  React.useEffect(() => {
    if (pageIndex > 0 && pageIndex >= pageCount) {
      table.setPageIndex(Math.max(0, pageCount - 1))
    }
  }, [pageIndex, pageCount, table])

  function next() {
    if (table.getCanNextPage()) {
      table.nextPage()
    } else if (canLoadMore && server) {
      pendingAdvance.current = true
      server.loadMore(pagination.pageSize * 2)
    }
  }

  const rows = table.getRowModel().rows
  const loadedCount = table.getFilteredRowModel().rows.length

  function exportCsv() {
    // Visible accessor columns only (action/render-only columns have no value).
    const cols = table
      .getVisibleLeafColumns()
      .filter((c) => c.accessorFn !== undefined)
    const header = cols.map((c) => csvCell(c.columnDef.meta?.label ?? c.id)).join(",")
    const lines = table
      .getFilteredRowModel()
      .rows.map((r) => cols.map((c) => csvCell(r.getValue(c.id))).join(","))
    // BOM so Excel opens UTF-8 correctly.
    const blob = new Blob(["﻿" + [header, ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${exportName}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className={cn(
        "bg-card overflow-hidden rounded-2xl border shadow-sm",
        className,
      )}
    >
      {(toolbar || viewOptions || clientSearch !== undefined || exportName !== undefined) && (
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
          {clientSearch !== undefined && (
            <div className="relative">
              <Search className="text-muted-foreground absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2" />
              <Input
                placeholder={clientSearch}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="bg-background h-9 w-60 rounded-lg ps-8"
              />
            </div>
          )}
          {toolbar}
          {(exportName !== undefined || viewOptions) && (
            <div className="ms-auto flex items-center gap-1">
              {exportName !== undefined && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground h-9"
                  title={labels.exportTitle}
                  onClick={exportCsv}
                  disabled={loading || loadedCount === 0}
                >
                  <Download className="size-4" /> {labels.export}
                </Button>
              )}
              {viewOptions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground h-9">
                      <Settings2 className="size-4" /> {labels.columns}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuLabel>{labels.toggleColumns}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {table
                      .getAllColumns()
                      .filter((c) => c.getCanHide())
                      .map((column) => (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          checked={column.getIsVisible()}
                          onCheckedChange={(v) => column.toggleVisibility(!!v)}
                          className="capitalize"
                        >
                          {column.columnDef.meta?.label ?? column.id}
                        </DropdownMenuCheckboxItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </div>
      )}

      <Table>
        <TableHeader className="bg-muted/40 [&_tr]:border-b">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="text-muted-foreground h-10 px-4 text-xs font-semibold uppercase tracking-wider first:ps-5 last:pe-5"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i} className="hover:bg-transparent">
                {Array.from({ length: visibleColumnCount }).map((_, j) => (
                  <TableCell key={j} className="px-4 py-3.5 first:ps-5 last:pe-5">
                    <Skeleton
                      className="h-4"
                      style={{ width: `${55 + ((i * 7 + j * 13) % 40)}%` }}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={visibleColumnCount} className="h-36">
                <div className="text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <div className="bg-muted flex size-10 items-center justify-center rounded-full">
                    <SearchX className="size-5" />
                  </div>
                  <span className="text-sm">{labels.noResults}</span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn(
                  "hover:bg-accent/40 border-b transition-colors last:border-0",
                  onRowClick && "cursor-pointer",
                )}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-4 py-3 first:ps-5 last:pe-5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2.5">
        <span className="text-muted-foreground text-xs tabular-nums">
          {loading
            ? labels.loading
            : `${labels.rowsLoaded(loadedCount)}${
                canLoadMore || loadingMore ? ` · ${labels.moreOnServer}` : ""
              }`}
        </span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground hidden text-xs sm:inline">
              {labels.rowsPerPage}
            </span>
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(v) => table.setPageSize(Number(v))}
            >
              <SelectTrigger
                size="sm"
                className="h-7 w-[4.25rem] border-none bg-transparent shadow-none"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="text-muted-foreground text-xs tabular-nums">
            {labels.pageOf(
              pageCount === 0 ? 0 : pageIndex + 1,
              pageCount,
              canLoadMore || loadingMore,
            )}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              disabled={pageIndex === 0}
              onClick={() => table.setPageIndex(0)}
            >
              <ChevronsLeft className="size-4 rtl:rotate-180" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              <ChevronLeft className="size-4 rtl:rotate-180" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              disabled={(!table.getCanNextPage() && !canLoadMore) || loadingMore}
              onClick={next}
            >
              {loadingMore ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ChevronRight className="size-4 rtl:rotate-180" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export { DataTable, DataTableColumnHeader }
