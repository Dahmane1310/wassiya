import { Redirect } from "expo-router"
import { ContactsScreen } from "@/screens/contacts"
import { useVaultStore } from "@/stores/vault"

/** Beneficiaries + executors management (pushed from Profile). Needs the master
 *  key to encrypt private labels, so it's gated on an unlocked vault. */
export default function Contacts() {
  const unlocked = useVaultStore((s) => s.status === "unlocked")
  if (!unlocked) {
    return <Redirect href="/unlock" />
  }
  return <ContactsScreen />
}
