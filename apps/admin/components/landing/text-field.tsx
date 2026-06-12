"use client"

import { useId } from "react"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"

type Props = {
  label: string
  kind: "text" | "textarea"
  value: string
  onChange: (next: string) => void
}

/** Labeled input/textarea — the leaf renderer of the landing editor. */
export function TextField({ label, kind, value, onChange }: Props) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-muted-foreground text-xs">
        {label}
      </Label>
      {kind === "textarea" ? (
        <Textarea
          id={id}
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  )
}
