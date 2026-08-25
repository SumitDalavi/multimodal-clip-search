/**
 * CLIP Model Inference using @xenova/transformers
 * 
 * This module downloads and caches the CLIP-ViT-B/32 model on first run,
 * then provides methods to generate embeddings for both text and images.
 */

// @ts-ignore - no types for @xenova/transformers
import { pipeline, env, RawImage } from '@xenova/transformers';

// Disable local model loading - always download from HuggingFace Hub
env.allowLocalModels = false;

let textPipeline: any = null;
let imagePipeline: any = null;

const MODEL_NAME = 'Xenova/clip-vit-base-patch32';

/**
 * Initialize the CLIP text embedding pipeline.
 * Downloads the model on first call (~170MB quantized).
 */
export async function getTextPipeline() {
  if (!textPipeline) {
    console.log('[CLIP] Loading text embedding pipeline...');
    textPipeline = await pipeline('feature-extraction', MODEL_NAME, {
      quantized: true
    });
    console.log('[CLIP] Text pipeline ready.');
  }
  return textPipeline;
}

/**
 * Initialize the CLIP image embedding pipeline.
 * Uses the same model weights as text but processes image inputs.
 */
export async function getImagePipeline() {
  if (!imagePipeline) {
    console.log('[CLIP] Loading image embedding pipeline...');
    imagePipeline = await pipeline('image-feature-extraction', MODEL_NAME, {
      quantized: true
    });
    console.log('[CLIP] Image pipeline ready.');
  }
  return imagePipeline;
}

/**
 * Generate a normalized embedding vector for a text query.
 * @param text - The natural language search query
 * @returns A Float32Array of 512 dimensions
 */
export async function embedText(text: string): Promise<number[]> {
  const pipe = await getTextPipeline();
  const output = await pipe(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data as Float32Array);
}

/**
 * Generate a normalized embedding vector for an image.
 * @param imagePath - Path to an image file on disk
 * @returns A Float32Array of 512 dimensions
 */
export async function embedImage(imagePath: string): Promise<number[]> {
  const pipe = await getImagePipeline();
  const image = await RawImage.read(imagePath);
  const output = await pipe(image);
  // output is a Tensor; flatten and normalize
  const data = Array.from(output.data as Float32Array);
  const norm = Math.sqrt(data.reduce((sum: number, v: number) => sum + v * v, 0));
  return data.map((v: number) => v / (norm || 1));
}
