"use client"

import { useId } from "react"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { cn } from "@workspace/ui/lib/utils"

/** Labeled input for the auth forms — same API the old hand-rolled Field had,
 *  now on the shared Input/Label. */
export function AuthField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  mono,
  hint,
  autoFocus,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  mono?: boolean
  hint?: string
  autoFocus?: boolean
}) {
  const id = useId()
  return (
    <div className="mb-4">
      <Label htmlFor={id} className="text-foreground/70 mb-1.5 text-[13px] font-bold">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn("h-12 rounded-xl text-[15px] font-semibold", mono && "mono")}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <div className="text-muted-foreground mt-1.5 text-xs">{hint}</div>}
    </div>
  )
}
