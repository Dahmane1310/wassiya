"use client"

import Link from "next/link"
import { Check, Copy } from "lucide-react"
import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { subjectOf } from "@/lib/owner-id"

/** Owner reference linking to the user detail page, with copy. URLs carry the
 *  bare WorkOS subject so they stay readable. */
export function OwnerRef({ ownerId, email }: { ownerId: string; email?: string | null }) {
  const [copied, setCopied] = useState(false)
  const subject = subjectOf(ownerId)
  return (
    <span className="inline-flex max-w-full items-center gap-1">
      <Link
        href={`/users/${subject}`}
        className="hover:text-primary truncate text-sm hover:underline"
        title={ownerId}
      >
        {email ?? <span className="font-mono text-xs">{subject}</span>}
      </Link>
      <Button
        variant="ghost"
        size="icon"
        className="size-6 shrink-0"
        onClick={() => {
          void navigator.clipboard?.writeText(ownerId)
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        }}
      >
        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      </Button>
    </span>
  )
}
