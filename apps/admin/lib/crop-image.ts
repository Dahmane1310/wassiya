import { type Area } from "react-easy-crop"

const OUTPUT_SIZE = 512

/** Render the selected crop area onto a square canvas and return it as a
 *  compressed blob — only the cropped result is ever uploaded. */
export async function cropImageToBlob(src: string, area: Area): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = () => reject(new Error("image load failed"))
    i.src = src
  })

  const canvas = document.createElement("canvas")
  canvas.width = OUTPUT_SIZE
  canvas.height = OUTPUT_SIZE
  const ctx = canvas.getContext("2d")
  if (ctx === null) throw new Error("no 2d context")
  ctx.drawImage(
    img,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  )

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b !== null ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/webp",
      0.9,
    )
  })
}
