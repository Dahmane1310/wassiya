import { useRouter } from "expo-router"
import { LogOut } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/stores/auth"
import { SettingsRow } from "@/screens/settings/components/settings-row"
import { SettingsSection } from "@/screens/settings/components/settings-section"

/** Account: sign out. Must route back to "/" — the group layout only guards the
 *  vault status, not auth, so it won't eject a signed-out user on its own. */
export function AccountSection() {
  const { t } = useTranslation()
  const router = useRouter()
  const signOut = useAuthStore((s) => s.signOut)

  async function handleSignOut() {
    await signOut()
    router.replace("/")
  }

  return (
    <SettingsSection title={t("settings.account")}>
      <SettingsRow
        icon={LogOut}
        label={t("settings.signOut")}
        onPress={() => void handleSignOut()}
        destructive
      />
    </SettingsSection>
  )
}
