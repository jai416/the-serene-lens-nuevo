import { logger } from "@/lib/logger"
import { analyzeImageWithNvidia, analyzeMultipleImagesWithNvidia } from "@/lib/nvidia-vision"
import { analyzeImageWithGemini, analyzeMultipleImagesWithGemini } from "@/lib/gemini-vision"

export async function analyzeImage(
  imageBase64: string,
  prompt: string,
  systemPrompt: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<any> {
  if (process.env.NVIDIA_API_KEY) {
    try {
      return await analyzeImageWithNvidia(imageBase64, prompt, systemPrompt, options)
    } catch (e) {
      logger.warn("NVIDIA vision failed, falling back to Gemini", { error: e instanceof Error ? e.message : String(e) })
    }
  }
  return analyzeImageWithGemini(imageBase64, prompt, systemPrompt, options)
}

export async function analyzeMultipleImages(
  imagesBase64: string[],
  prompt: string,
  systemPrompt: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<any> {
  if (process.env.NVIDIA_API_KEY) {
    try {
      return await analyzeMultipleImagesWithNvidia(imagesBase64, prompt, systemPrompt, options)
    } catch (e) {
      logger.warn("NVIDIA multi-image failed, falling back to Gemini", { error: e instanceof Error ? e.message : String(e) })
    }
  }
  return analyzeMultipleImagesWithGemini(imagesBase64, prompt, systemPrompt, options)
}
