/**
 * In-Memory Vector Store with Cosine Similarity Search
 * 
 * Stores image metadata alongside their CLIP embedding vectors.
 * Supports exact K-Nearest Neighbors (KNN) for demo-scale datasets.
 */

export interface IndexedImage {
  id: string;
  filename: string;
  url: string;          // Serve path for the frontend
  embedding: number[];  // 512-dim CLIP vector
  indexedAt: string;
}

const store: IndexedImage[] = [];

/**
 * Add an image and its embedding to the vector store.
 */
export function addToStore(image: IndexedImage) {
  store.push(image);
}

/**
 * Compute cosine similarity between two vectors.
 * Both vectors are assumed to be pre-normalized (unit vectors),
 * so cosine similarity simplifies to a dot product.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

/**
 * Search the vector store for the top-K most similar images to a query embedding.
 * @param queryEmbedding - The 512-dim embedding of the text query
 * @param topK - Number of results to return (default 10)
 */
export function search(queryEmbedding: number[], topK: number = 10): Array<IndexedImage & { score: number }> {
  const results = store.map(item => ({
    ...item,
    score: cosineSimilarity(queryEmbedding, item.embedding)
  }));

  // Sort by descending similarity
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, topK);
}

/**
 * Get the total number of indexed images.
 */
export function getStoreSize(): number {
  return store.length;
}

/**
 * Get all items in the store (for listing on the frontend).
 */
export function getAllImages(): Omit<IndexedImage, 'embedding'>[] {
  return store.map(({ embedding, ...rest }) => rest);
}
