"use client"

import { useEffect, useState } from "react"
import { Search, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  delay?: number
  className?: string
}

/** Search input that emits after a typing pause — keeps server-side search
 *  filters from re-running the Convex query on every keystroke. */
export function DebouncedInput({
  value,
  onChange,
  placeholder,
  delay = 350,
  className,
}: Props) {
  const [draft, setDraft] = useState(value)

  useEffect(() => setDraft(value), [value])

  useEffect(() => {
    if (draft === value) return
    const t = setTimeout(() => onChange(draft), delay)
    return () => clearTimeout(t)
  }, [draft, value, onChange, delay])

  return (
    <div className={cn("relative", className)}>
      <Search className="text-muted-foreground absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2" />
      <Input
        placeholder={placeholder}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="bg-background h-9 w-full rounded-lg ps-8 pe-7"
      />
      {draft !== "" && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute end-0.5 top-1/2 size-6 -translate-y-1/2"
          onClick={() => {
            setDraft("")
            onChange("")
          }}
        >
          <X className="size-3" />
        </Button>
      )}
    </div>
  )
}
