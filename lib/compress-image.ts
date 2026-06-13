/**
 * Client-side image compression. Reads a File, downsizes it to fit within
 * `maxDim` on its longest edge, and re-encodes it (JPEG by default) so we never
 * store giant base64 blobs in the DB. Runs in the browser only (uses canvas).
 *
 * Falls back to the original data URL if anything goes wrong or if compression
 * somehow produced a larger result.
 */
export async function compressImageToDataUrl(
  file: File,
  opts: { maxDim?: number; quality?: number; mimeType?: string } = {},
): Promise<string> {
  const maxDim = opts.maxDim ?? 1400
  const quality = opts.quality ?? 0.82
  const mimeType = opts.mimeType ?? "image/jpeg"

  const originalDataUrl = await readAsDataUrl(file)

  try {
    const img = await loadImage(originalDataUrl)

    let { width, height } = img
    if (width > maxDim || height > maxDim) {
      const scale = Math.min(maxDim / width, maxDim / height)
      width = Math.round(width * scale)
      height = Math.round(height * scale)
    }

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) return originalDataUrl

    // White matte so transparent PNGs don't turn black when flattened to JPEG.
    if (mimeType === "image/jpeg") {
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, width, height)
    }
    ctx.drawImage(img, 0, 0, width, height)

    const compressed = canvas.toDataURL(mimeType, quality)
    return compressed.length < originalDataUrl.length ? compressed : originalDataUrl
  } catch {
    return originalDataUrl
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Failed to decode image"))
    img.src = src
  })
}
