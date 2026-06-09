import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"

import type { QA } from "../i18n/types"

// The one interactive island on the landing. Wraps the shared shadcn (Radix)
// Accordion; hydrated via client:visible from FAQ.astro. First item open.
export default function FaqAccordion({ items }: { items: QA[] }) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="faq-0"
      className="mx-auto flex max-w-3xl flex-col gap-3"
    >
      {items.map((it, i) => (
        <AccordionItem
          key={i}
          value={`faq-${i}`}
          className="rounded-2xl border bg-card px-5 shadow-sm not-last:border-b"
        >
          <AccordionTrigger className="py-5 text-base font-semibold hover:no-underline">
            {it.q}
          </AccordionTrigger>
          <AccordionContent className="pb-5 text-[15px] leading-relaxed text-muted-foreground">
            {it.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
