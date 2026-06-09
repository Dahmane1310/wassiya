import { ContactsScreen } from "@/screens/contacts"

/** Non-heir recipients (reached from Profile / Wasiyyah). Lives inside the (vault)
 *  tab group so the bottom tab bar stays visible — the URL is still `/contacts`
 *  because the group name is omitted from the path. The parent layout already gates
 *  auth + an unlocked vault, and it's hidden from the bar (see VaultTabBar). */
export default function Contacts() {
  return <ContactsScreen />
}
