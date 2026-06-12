"use client"

import { useState } from "react"
import Link from "next/link"
import { useAction, useQuery } from "convex/react"
import {
  ArrowUpRight,
  Database,
  ExternalLink,
  KeyRound,
  Mail,
  Rocket,
  Smartphone,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Spinner } from "@workspace/ui/components/spinner"
import { ConfigureDialog } from "./configure-dialog"
import { IntegrationRow } from "./integration-row"

function fmtCount(c: { value: number; capped: boolean }): string {
  return c.capped ? `${c.value}+` : String(c.value)
}

/** "https://<slug>.<region>.convex.cloud" → the dashboard deep link. */
function dashboardUrl(deployment: string): string | null {
  try {
    const slug = new URL(deployment).hostname.split(".")[0]
    return slug ? `https://dashboard.convex.dev/d/${slug}` : null
  } catch {
    return null
  }
}

function ActivityLink({ href, label }: { href: string; label: string }) {
  return (
    <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
      <Link href={href}>
        <ArrowUpRight /> {label}
      </Link>
    </Button>
  )
}

/** External services the product depends on: live status, one-click tests and
 *  in-panel secret management (superadmin, write-only, env fallback). */
export function IntegrationsScreen() {
  const { t } = useTranslation()
  const data = useQuery(api.admin.integrations.getIntegrations)
  const sendTestEmail = useAction(api.admin.integrations.sendTestEmail)
  const testDeployHook = useAction(api.admin.integrations.testDeployHook)
  const [busy, setBusy] = useState<"email" | "hook" | null>(null)

  async function run(kind: "email" | "hook") {
    setBusy(kind)
    try {
      if (kind === "email") {
        await sendTestEmail({})
        toast.success(t("integrations.testEmailSent"))
      } else {
        await testDeployHook({})
        toast.success(t("integrations.hookOk"))
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : ""
      toast.error(
        msg.includes("NOT_CONFIGURED")
          ? t("integrations.notConfiguredToast")
          : kind === "email"
            ? t("integrations.testEmailFailed")
            : t("integrations.hookFailed"),
      )
    } finally {
      setBusy(null)
    }
  }

  if (data === undefined) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  const connected = [
    data.resend.configured,
    data.revenuecat.configured,
    data.deployHook.configured,
    data.workos.configured,
    data.convex.deployment !== null,
  ].filter(Boolean).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            {t("integrations.title")}
          </h1>
          <p className="text-muted-foreground text-sm">{t("integrations.subtitle")}</p>
        </div>
        <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
          <span className="size-1.5 rounded-full bg-green-500" />
          {t("integrations.summary", { connected, total: 5 })}
        </span>
      </div>

      <Card className="py-0">
        <CardContent className="divide-border/60 divide-y p-0">
          <IntegrationRow
            icon={Mail}
            tint="bg-primary/10 text-primary"
            name={t("integrations.resend.name")}
            description={t("integrations.resend.desc")}
            configured={data.resend.configured}
            source={data.resend.source}
            meta={t("integrations.resend.meta", { from: data.resend.emailFrom ?? "—" })}
            stats={[
              { value: fmtCount(data.resend.sent), label: t("integrations.sentLabel") },
              {
                value: fmtCount(data.resend.failed),
                label: t("integrations.failedLabel"),
                tone: data.resend.failed.value > 0 ? "bad" : "ok",
              },
              {
                value: fmtCount(data.resend.pending),
                label: t("integrations.pendingLabel"),
              },
            ]}
            action={
              <>
                <ActivityLink
                  href="/notifications?status=failed"
                  label={t("integrations.viewActivity")}
                />
                {data.resend.configured && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy !== null}
                    onClick={() => void run("email")}
                  >
                    {busy === "email" ? <Spinner className="size-4" /> : <Mail />}
                    {t("integrations.testEmail")}
                  </Button>
                )}
                <ConfigureDialog
                  name={t("integrations.resend.name")}
                  configured={data.resend.configured}
                  source={data.resend.source}
                  fields={[{ key: "RESEND_API_KEY", secret: true }, { key: "EMAIL_FROM" }]}
                />
              </>
            }
          />

          <IntegrationRow
            icon={Smartphone}
            tint="bg-green-600/10 text-green-700 dark:text-green-400"
            name={t("integrations.revenuecat.name")}
            description={t("integrations.revenuecat.desc")}
            configured={data.revenuecat.configured}
            source={data.revenuecat.source}
            meta={
              data.revenuecat.lastEventAt !== null
                ? t("integrations.revenuecat.lastEvent", {
                    date: new Date(data.revenuecat.lastEventAt).toLocaleString(),
                  })
                : t("integrations.revenuecat.noEvents")
            }
            action={
              <>
                <ActivityLink href="/billing" label={t("integrations.viewActivity")} />
                <ConfigureDialog
                  name={t("integrations.revenuecat.name")}
                  configured={data.revenuecat.configured}
                  source={data.revenuecat.source}
                  fields={[{ key: "REVENUECAT_WEBHOOK_AUTH", secret: true }]}
                />
              </>
            }
          />

          <IntegrationRow
            icon={Rocket}
            tint="bg-amber-500/15 text-amber-700 dark:text-amber-400"
            name={t("integrations.deploy.name")}
            description={t("integrations.deploy.desc")}
            configured={data.deployHook.configured}
            source={data.deployHook.source}
            meta={
              data.deployHook.lastDeployAt !== null
                ? t(
                    data.deployHook.lastDeployOk === false
                      ? "integrations.deploy.lastFailed"
                      : "integrations.deploy.lastOk",
                    { date: new Date(data.deployHook.lastDeployAt).toLocaleString() },
                  )
                : t("integrations.deploy.never")
            }
            action={
              <>
                <ActivityLink
                  href="/audit?event=landing_published"
                  label={t("integrations.viewActivity")}
                />
                {data.deployHook.configured && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy !== null}
                    onClick={() => void run("hook")}
                  >
                    {busy === "hook" ? <Spinner className="size-4" /> : <Rocket />}
                    {t("integrations.testHook")}
                  </Button>
                )}
                <ConfigureDialog
                  name={t("integrations.deploy.name")}
                  configured={data.deployHook.configured}
                  source={data.deployHook.source}
                  fields={[{ key: "LANDING_DEPLOY_HOOK_URL" }]}
                />
              </>
            }
          />

          <IntegrationRow
            icon={KeyRound}
            tint="bg-blue-500/10 text-blue-700 dark:text-blue-400"
            name={t("integrations.workos.name")}
            description={t("integrations.workos.desc")}
            configured={data.workos.configured}
            meta={t("integrations.workos.meta", { id: data.workos.clientId ?? "—" })}
            action={
              <ActivityLink href="/users" label={t("integrations.viewActivity")} />
            }
          />

          <IntegrationRow
            icon={Database}
            tint="bg-secondary text-muted-foreground"
            name={t("integrations.convex.name")}
            description={t("integrations.convex.desc")}
            configured={data.convex.deployment !== null}
            meta={data.convex.deployment ?? undefined}
            action={
              data.convex.deployment !== null &&
              dashboardUrl(data.convex.deployment) !== null && (
                <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
                  <a
                    href={dashboardUrl(data.convex.deployment)!}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink /> {t("integrations.openDashboard")}
                  </a>
                </Button>
              )
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}
