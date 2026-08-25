import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { embedText, embedImage } from './ml/clip';
import { addToStore, search, getStoreSize, getAllImages } from './db/vectorStore';

const app = express();
app.use(cors());
app.use(express.json());

// --- File Upload Setup ---
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

// Serve uploaded images statically
app.use('/uploads', express.static(UPLOADS_DIR));

// --- ENDPOINTS ---

/**
 * POST /api/index
 * Upload an image file to be indexed into the vector store.
 * The CLIP model generates an embedding for the image on upload.
 */
app.post('/api/index', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file provided' });

  try {
    console.log(`[Index] Generating embedding for ${req.file.filename}...`);
    const embedding = await embedImage(req.file.path);

    const id = `img_${Date.now()}`;
    addToStore({
      id,
      filename: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      embedding,
      indexedAt: new Date().toISOString()
    });

    console.log(`[Index] Indexed ${req.file.originalname}. Store size: ${getStoreSize()}`);
    res.json({ id, storeSize: getStoreSize() });
  } catch (err: any) {
    console.error('[Index] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/index-url
 * Index an image from a URL (downloads it first).
 */
app.post('/api/index-url', async (req, res) => {
  const { url, name } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing url field' });

  try {
    // Download the image
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    
    const filename = `${Date.now()}-${(name || 'image').replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
    const filePath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(filePath, buffer);

    console.log(`[Index-URL] Generating embedding for ${name || url}...`);
    const embedding = await embedImage(filePath);

    const id = `img_${Date.now()}`;
    addToStore({
      id,
      filename: name || url,
      url: `/uploads/${filename}`,
      embedding,
      indexedAt: new Date().toISOString()
    });

    console.log(`[Index-URL] Indexed ${name || url}. Store size: ${getStoreSize()}`);
    res.json({ id, storeSize: getStoreSize() });
  } catch (err: any) {
    console.error('[Index-URL] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/search
 * Search images using a natural language text query.
 * Generates a CLIP text embedding and finds the closest images via cosine similarity.
 */
app.post('/api/search', async (req, res) => {
  const { query, topK } = req.body;
  if (!query) return res.status(400).json({ error: 'Missing query field' });

  try {
    console.log(`[Search] Query: "${query}"`);
    const queryEmbedding = await embedText(query);
    const results = search(queryEmbedding, topK || 10);

    // Strip embeddings from response
    const cleanResults = results.map(({ embedding, ...rest }) => rest);
    res.json({ query, results: cleanResults });
  } catch (err: any) {
    console.error('[Search] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/images
 * List all indexed images (without their embeddings).
 */
app.get('/api/images', (_req, res) => {
  res.json({ images: getAllImages(), total: getStoreSize() });
});

const PORT = process.env.PORT || 4004;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Multimodal CLIP Search API running on port ${PORT}`);
    console.log(`Upload directory: ${UPLOADS_DIR}`);
  });
}

export default app;
