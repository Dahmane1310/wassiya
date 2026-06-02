// Route file: keep `app/` thin (routing only). Screens live in `screens/*`
// (folder per screen: `index.tsx` + colocated `components/`). The route renders
// its screen. See screens/welcome/index.tsx.
import { WelcomeScreen } from "@/screens/welcome"

export default function Index() {
  return <WelcomeScreen />
}
