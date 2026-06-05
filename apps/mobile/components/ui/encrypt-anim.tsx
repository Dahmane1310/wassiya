import { useEffect, useRef, useState } from "react"
import { View } from "react-native"
import Animated from "react-native-reanimated"
import { Lock, LockOpen, ShieldCheck } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"
import { useThemeColors } from "@/lib/colors"
import { usePop, usePulseRings } from "@/lib/motion"

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789+/"

function cipherTarget(plain: string) {
  const hex = Array.from(plain + "::wassiya")
    .map((ch) => ch.charCodeAt(0).toString(16))
    .join("")
    .toUpperCase()
  return (hex + CHARS).slice(0, 40)
}

/**
 * The "encrypting on device" flourish — plaintext scrambles into ciphertext, the
 * lock closes, then a shield confirms. Purely visual; render it over the real
 * encryption/save so the security work is felt, not just spinnered.
 */
export function EncryptAnim({ plain }: { plain: string }) {
  const { t } = useTranslation()
  const { display: displayFont, body } = useBrandType()
  const c = useThemeColors()
  const [phase, setPhase] = useState<"scramble" | "lock" | "done">("scramble")
  const target = useRef(cipherTarget(plain))
  const [display, setDisplay] = useState(plain.slice(0, 40))
  const rings = usePulseRings(2, 1800)
  const pop = usePop(phase === "done")

  useEffect(() => {
    let frame = 0
    const tgt = target.current
    const iv = setInterval(() => {
      frame++
      const settled = Math.floor((frame / 22) * tgt.length)
      let out = ""
      for (let i = 0; i < tgt.length; i++) {
        out += i < settled ? tgt[i] : CHARS[Math.floor((frame * 7 + i * 13) % CHARS.length)]
      }
      setDisplay(out)
      if (frame >= 22) {
        clearInterval(iv)
        setPhase("lock")
        setTimeout(() => setPhase("done"), 700)
      }
    }, 60)
    return () => clearInterval(iv)
  }, [])

  const done = phase === "done"
  const Glyph = done ? ShieldCheck : phase === "lock" ? Lock : LockOpen

  return (
    <View className="items-center px-5 pb-7 pt-2.5">
      <View className="my-3 h-24 w-24 items-center justify-center">
        {!done
          ? rings.map((style, i) => (
              <Animated.View
                key={i}
                pointerEvents="none"
                style={[
                  { position: "absolute", height: 60, width: 60, borderRadius: 999, borderWidth: 2, borderColor: c.primary },
                  style,
                ]}
              />
            ))
          : null}
        <Animated.View
          style={[done ? pop : undefined]}
          className={done ? "h-24 w-24 items-center justify-center rounded-full bg-green-soft" : "h-24 w-24 items-center justify-center rounded-full bg-primary-soft"}
        >
          <Glyph size={42} color={done ? c.green : c.primary} strokeWidth={1.9} />
        </Animated.View>
      </View>
      <Text className={cn("mt-1.5 text-[20px] text-foreground", displayFont)}>
        {done ? t("encrypt.doneTitle") : t("encrypt.title")}
      </Text>
      <Text className={cn("mt-1 text-center text-[13px] text-ink-2", body)}>
        {done ? t("encrypt.doneBody") : t("encrypt.body")}
      </Text>
      <View className="mt-4 w-full rounded-xl border border-border bg-card p-3.5">
        <Text className="font-mono text-[12px] leading-5 text-ink-3">{display}</Text>
      </View>
    </View>
  )
}
