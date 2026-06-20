# RAG Embed

Embeddable RAG microservice with Docker, PostgreSQL+pgvector, MinIO, pluggable LLMs, and a drop-in chat widget.

## Quick start (5 minutes)

```bash
cp .env.example .env
# On Windows: docker compose --profile local-llm up -d --build
docker compose --profile local-llm up -d --build
```

| Service | URL |
|---------|-----|
| API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Setup Wizard | http://localhost:8080 |
| MinIO Console | http://localhost:9001 |

Default keys (change in `.env`):
- API Key: `rag_dev_api_key_change_me`
- Widget Key: `wk_dev_widget_key_change_me`

## Embed on your site

```html
<script
  src="http://localhost:8000/widget/v1/embed.js"
  data-widget-key="wk_dev_widget_key_change_me"
  data-api-url="http://localhost:8000"
  data-site-url="http://localhost:3000"
  async
></script>
```

## LLM providers

Set `LLM_PROVIDER` in `.env`:

| Provider | Value | Key env |
|----------|-------|---------|
| Ollama (local) | `ollama` | none |
| OpenAI | `openai` | `OPENAI_API_KEY` |
| Claude | `anthropic` | `ANTHROPIC_API_KEY` |
| Gemini | `gemini` | `GOOGLE_API_KEY` |
| Azure OpenAI | `azure_openai` | `AZURE_OPENAI_*` |
| Any OpenAI-compatible API | `openai_compatible` | `LLM_BASE_URL`, `LLM_API_KEY` |

## API examples

```bash
# Upload document
curl -X POST http://localhost:8000/v1/collections/{id}/documents \
  -H "Authorization: Bearer rag_dev_api_key_change_me" \
  -F "file=@faq.pdf"

# Chat
curl -X POST http://localhost:8000/v1/chat \
  -H "Authorization: Bearer rag_dev_api_key_change_me" \
  -H "Content-Type: application/json" \
  -d '{"message": "What is your refund policy?", "stream": false}'
```

## Build widget locally

```bash
cd widget && npm install && npm run build
```

## Multi-tenant mode

Set `DEPLOYMENT_MODE=multi_tenant` and use `POST /v1/admin/tenants` to create tenants.

## Architecture

- **api** — FastAPI REST + widget static files
- **worker** — ARQ document ingestion (parse, chunk, embed)
- **postgres** — pgvector + pg_trgm hybrid search
- **minio** — document storage
- **redis** — job queue
- **ollama** — local LLM + embeddings (optional profile)
