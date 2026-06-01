# @workspace/ui-native

[React Native Reusables](https://reactnativereusables.com) (shadcn/ui for React
Native) as a shared, source-only workspace package — the mobile counterpart to
`@workspace/ui`. Components use `className` (Tailwind) and are styled by
**[Uniwind](https://uniwind.dev)** (Tailwind v4 for React Native).

You **own** these components: edit them freely. Like shadcn, they are copied in,
not imported from a black-box dependency.

## Architecture: where things live

This package ships **only component source + their deps**. The **styling engine
configuration lives in each consuming app** (the Metro bundler runs there):

| Concern | Location |
| --- | --- |
| Component `.tsx` source, `@rn-primitives/*`, `cva`, `lucide-react-native` | **this package** |
| `uniwind/metro` plugin, `global.css`, theme tokens, `@source`, generated types, reanimated babel plugin | **the app** (see `apps/mobile`) |

A new app that wants these components repeats only the app-side wiring (copy it
from `apps/mobile`): `metro.config.js` (`withUniwindConfig`), `src/global.css`
(must include `@source '<rel>/packages/ui-native/src'` or classes used only here
get purged), import the CSS in the root layout, add the reanimated worklets babel
plugin, and render `<PortalHost />` (from `@rn-primitives/portal`) at the root.

## Consuming it

```ts
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
```

Add to the app's `tsconfig.json` paths:
`"@workspace/ui-native/*": ["../../packages/ui-native/src/*"]`.

## Adding more components

The full RNR catalog is at https://reactnativereusables.com. Add a component
from the **uniwind** registry, then rewrite its import alias to this package:

```bash
# Fetch the registry item (self-contained, with inline source):
curl -sSL https://reactnativereusables.com/r/uniwind/<name>.json
# Write files into src/components/ui/, replacing the import prefix:
#   @/registry/uniwind/  ->  @workspace/ui-native/
```

Then add any new npm deps the item lists (`dependencies`) to this package's
`package.json` (e.g. another `@rn-primitives/*`), and `pnpm install`.

> Tip: components reference `React.*` types without importing React — that's
> intentional (the global `React` UMD namespace from `@types/react`). Keep files
> verbatim from upstream where possible so future updates stay easy to diff.

## ⚠️ Divergence from the `expo-tailwind-setup` skill

The repo's `expo-tailwind-setup` skill documents **NativeWind v5 +
`react-native-css`** with `globalClassNamePolyfill: false` and manual
`useCssElement` wrappers. This package instead uses **Uniwind**, which enables
`className` on React Native core components automatically (no wrappers) — the
model React Native Reusables requires. The two approaches are mutually
exclusive; for the mobile UI layer, this package supersedes that skill.
