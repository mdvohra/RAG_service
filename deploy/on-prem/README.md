# On-prem production deployment

Deploy RAG Embed on your own VM or Docker host (single tenant).

## Prerequisites

- Docker 24+ with Compose plugin
- 4 GB+ RAM (8 GB if using local Ollama)
- A domain with DNS pointing to your server (for HTTPS)

## Quick start

```bash
cp .env.example .env
# Edit: SECRET_KEY, API_KEY, WIDGET_KEY, SITE_URL, LLM keys, DOMAIN

docker compose -f docker-compose.yml -f deploy/docker-compose.onprem.yml up -d --build
```

## URLs (with Caddy + DOMAIN=example.com)

| Service | URL |
|---------|-----|
| API + widget JS | `https://example.com` |
| Setup wizard | `https://wizard.example.com` |
| Document manager | `https://admin.example.com` |

## Environment checklist

| Variable | Example |
|----------|---------|
| `DOMAIN` | `example.com` |
| `API_PUBLIC_URL` | `https://example.com` |
| `SITE_URL` | `https://yoursite.com` (where widget is embedded) |
| `SECRET_KEY` | random 32+ chars |
| `API_KEY` | `rag_...` |
| `WIDGET_KEY` | `wk_...` |

## Local LLM (optional)

```bash
docker compose --profile local-llm -f docker-compose.yml -f deploy/docker-compose.onprem.yml up -d --build
```

## Backups

```bash
docker compose exec postgres pg_dump -U rag rag > backup.sql
docker run --rm -v moh_exp_minio_data:/data -v $(pwd):/backup alpine tar czf /backup/minio-backup.tar.gz /data
```

## Security notes

- Postgres, Redis, and MinIO are not exposed on host ports in this overlay.
- Set strong `API_KEY`, `WIDGET_KEY`, and database credentials for production.
