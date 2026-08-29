# multimodal-clip-search

Semantic search engine utilizing OpenAI's CLIP model to search for images using natural language text queries.

## Features
- Fully automated workflow.
- Secure, scalable architecture.
- Built-in telemetry and observability.

## Technologies
- Python, CLIP, Pinecone

## Getting Started
Ensure you have the required dependencies installed on your system.

```bash
# Setup & Test
pip install -r requirements.txt
pytest
```

## Architecture
Please see the [Architecture Document](docs/architecture.md) for sequence diagrams and system design details.


## CI & Reliability Updates (August 2026)

- **CI Pipeline Remediation:** Successfully resolved all CI/CD pipeline failures and established baseline CI workflows.
- **Specific Fix:** Added and configured robust GitHub Actions workflows for automated testing, linting, and formatting.
- **Status:** 🟩 Passing


## How It Works

1. **Upload** images via drag-and-drop or the file picker. Each image is passed through CLIP's vision encoder to produce a 512-dimensional embedding vector.
2. **Search** using natural language (e.g., "a golden retriever"). The text query is passed through CLIP's text encoder to produce a 512-dimensional embedding.
3. **Match**: The system computes cosine similarity between the query embedding and all stored image embeddings, returning the top-K most relevant images ranked by similarity score.