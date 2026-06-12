"use client"

import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

/** Provider-direct Google/Apple starts via /auth/oauth. */
export function OAuthButtons({ returnTo }: { returnTo: string }) {
  const { t } = useTranslation()
  const href = (provider: string) =>
    `/auth/oauth?provider=${provider}&returnTo=${encodeURIComponent(returnTo)}`
  return (
    <div className="flex flex-col gap-2">
      <Button asChild variant="outline" className="w-full">
        <a href={href("google")}>
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1-.8 2.6-2.4 3.7l3.7 2.8c2.3-2 3.7-5 3.7-8.7z" />
            <path fill="#34A853" d="M12 24c3.2 0 5.9-1 7.9-2.9l-3.7-2.8c-1 .7-2.4 1.2-4.2 1.2-3.1 0-5.8-2-6.8-4.9l-3.9 3C3.3 21.3 7.3 24 12 24z" />
            <path fill="#FBBC05" d="M5.2 14.6c-.2-.7-.4-1.5-.4-2.6s.2-1.9.4-2.6l-3.9-3C.5 8.1 0 10 0 12s.5 3.9 1.3 5.6l3.9-3z" />
            <path fill="#EA4335" d="M12 4.6c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.8 1 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.4l3.9 3c1-2.9 3.7-4.8 6.8-4.8z" />
          </svg>
          {t("auth.continueGoogle")}
        </a>
      </Button>
      <Button asChild variant="outline" className="w-full">
        <a href={href("apple")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M16.4 12.8c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 2.9-.4 7.3 1.2 9.7.8 1.2 1.8 2.5 3.1 2.4 1.2-.1 1.7-.8 3.2-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.6-1-2.7-3.8zM14 5.6c.7-.8 1.1-1.9 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z" />
          </svg>
          {t("auth.continueApple")}
        </a>
      </Button>
    </div>
  )
}
