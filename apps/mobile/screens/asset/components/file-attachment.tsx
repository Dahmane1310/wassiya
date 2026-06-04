import { View } from "react-native"
import * as DocumentPicker from "expo-document-picker"
import * as ImagePicker from "expo-image-picker"
import { FileText, ImagePlus, Paperclip, Trash2 } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { useBrandType } from "@/hooks/use-brand-type"
import { type Attachment } from "@/hooks/use-assets"

/** Pick / preview / remove ONE attachment (document or photo). The file's bytes
 *  are read + encrypted only at save time (in the hook), never here. */
export function FileAttachment({
  value,
  onChange,
}: {
  value: Attachment
  onChange: (attachment: Attachment) => void
}) {
  const { t } = useTranslation()
  const { ar, body } = useBrandType()
  const textFont = ar ? body : undefined

  async function pickDocument() {
    const res = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    })
    if (res.canceled) return
    const a = res.assets[0]
    if (!a) return
    onChange({
      kind: "picked",
      file: {
        uri: a.uri,
        name: a.name,
        mimeType: a.mimeType ?? undefined,
        size: a.size ?? undefined,
      },
    })
  }

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) return
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    })
    if (res.canceled) return
    const a = res.assets[0]
    if (!a) return
    onChange({
      kind: "picked",
      file: {
        uri: a.uri,
        name: a.fileName ?? "photo.jpg",
        mimeType: a.mimeType ?? undefined,
        size: a.fileSize ?? undefined,
      },
    })
  }

  if (value.kind === "none") {
    return (
      <View className="flex-row gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onPress={() => void pickDocument()}
        >
          <Icon as={Paperclip} className="text-foreground" size={16} />
          <Text className={textFont}>{t("asset.file.attachDocument")}</Text>
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onPress={() => void pickPhoto()}
        >
          <Icon as={ImagePlus} className="text-foreground" size={16} />
          <Text className={textFont}>{t("asset.file.attachPhoto")}</Text>
        </Button>
      </View>
    )
  }

  const name = value.kind === "picked" ? value.file.name : value.name
  return (
    <View className="flex-row items-center gap-2 rounded-lg border border-border bg-muted/30 py-1.5 pr-1 pl-3">
      <Icon as={FileText} className="text-muted-foreground" size={18} />
      <Text
        numberOfLines={1}
        className={cn("flex-1 text-sm text-foreground", body)}
      >
        {name}
      </Text>
      <Button
        variant="ghost"
        size="icon"
        onPress={() => onChange({ kind: "none" })}
        accessibilityLabel={t("asset.file.remove")}
      >
        <Icon as={Trash2} className="text-destructive" size={18} />
      </Button>
    </View>
  )
}
