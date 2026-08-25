# Multimodal CLIP Search Engine

A unified search engine that lets users find images using natural language text descriptions. Built entirely in **Node.js / TypeScript** using the CLIP (Contrastive Language-Image Pretraining) model running locally via `@xenova/transformers`.

## Architecture

```
┌─────────────────┐     ┌──────────────────────────────┐
│  React Frontend │────▶│  Express API (port 4004)      │
│  (Vite + TW4)   │     │                              │
│                 │     │  POST /api/index   (upload)   │
│  • Search bar   │     │  POST /api/index-url (URL)    │
│  • Drag & drop  │     │  POST /api/search  (query)    │
│  • Masonry grid │     │  GET  /api/images  (list)     │
└─────────────────┘     └────────┬─────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              ┌─────┴─────┐           ┌───────┴──────┐
              │  CLIP ML  │           │ Vector Store │
              │  Engine   │           │ (In-Memory)  │
              │           │           │              │
              │ clip.ts   │           │ Cosine KNN   │
              └───────────┘           └──────────────┘
```

## Tech Stack

- **Backend**: Express.js + TypeScript
- **ML Model**: `@xenova/transformers` (CLIP-ViT-B/32, quantized ONNX)
- **Vector DB**: In-memory exact KNN with cosine similarity
- **Frontend**: React + Vite + Tailwind CSS v4
- **File Upload**: Multer

## Quick Start

```bash
# 1. Start the backend (model downloads on first run, ~170MB)
cd server
node dist/index.js

# 2. Start the frontend
cd ../client
npm run dev
```

## How It Works

1. **Upload** images via drag-and-drop or the file picker. Each image is passed through CLIP's vision encoder to produce a 512-dimensional embedding vector.
2. **Search** using natural language (e.g., "a golden retriever"). The text query is passed through CLIP's text encoder to produce a 512-dimensional embedding.
3. **Match**: The system computes cosine similarity between the query embedding and all stored image embeddings, returning the top-K most relevant images ranked by similarity score.
