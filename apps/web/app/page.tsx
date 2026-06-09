import { redirect } from "next/navigation"

// The web app IS the beneficiary portal — send the root straight to the home tab.
export default function RootPage() {
  redirect("/home")
}
