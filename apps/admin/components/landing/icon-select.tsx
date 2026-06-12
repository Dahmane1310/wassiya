"use client"

import { useId } from "react"
import { ICON_NAMES, type IconName } from "@workspace/landing-content"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { ICON_COMPONENTS } from "./icon-map"

type Props = {
  label: string
  value: string
  onChange: (next: string) => void
}

/** Icon picker constrained to the names Icon.astro can actually render,
 *  with the real icon previewed beside each name. */
export function IconSelect({ label, value, onChange }: Props) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-muted-foreground text-xs">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ICON_NAMES.map((name) => {
            const Cmp = ICON_COMPONENTS[name as IconName]
            return (
              <SelectItem key={name} value={name}>
                <span className="flex items-center gap-2">
                  <Cmp className="text-muted-foreground size-4" />
                  {name}
                </span>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}
