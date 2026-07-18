import { captureError } from "./sentry"

let cloudinaryInstance: any = null

async function getCloudinary() {
  if (cloudinaryInstance) return cloudinaryInstance
  if (!isConfigured()) return null
  try {
    const mod = await import("cloudinary")
    const v2 = mod.v2
    v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    })
    cloudinaryInstance = v2
    return v2
  } catch (e) {
    captureError(e, { context: "cloudinary.init" })
    return null
  }
}

export type UploadResult = {
  url: string
  publicId: string
  width: number
  height: number
}

export async function uploadImage(
  file: string | Buffer,
  options?: { folder?: string; publicId?: string; transformation?: string },
): Promise<UploadResult | null> {
  try {
    const cloudinary = await getCloudinary()
    if (!cloudinary) return null
    const result = await cloudinary.uploader.upload(file, {
      folder: options?.folder || "the-serene-lens",
      public_id: options?.publicId,
      transformation: options?.transformation || "f_auto,q_auto",
    })
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    }
  } catch (e) {
    captureError(e, { context: "cloudinary.uploadImage" })
    return null
  }
}

export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    const cloudinary = await getCloudinary()
    if (!cloudinary) return false
    await cloudinary.uploader.destroy(publicId)
    return true
  } catch (e) {
    captureError(e, { context: "cloudinary.deleteImage" })
    return false
  }
}

export function isConfigured(): boolean {
  return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
}
