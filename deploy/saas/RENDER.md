# Deploy RAG4All SaaS on Render

Run the **multi-tenant** platform on Render — customers sign up at `app.yourdomain.com`, bring their own LLM keys, upload docs, and embed the widget.

> **Not for single-tenant.** Use [rag4all-deploy](https://github.com/mdvohra/RAG4All) (Docker Compose) for local / single-site deploy.

## What gets created

| Render resource | Role |
| --------------- | ---- |
| `rag4all-db` | PostgreSQL 16 (+ pgvector after init SQL) |
| `rag4all-redis` | Job queue for document processing |
| `rag4all-minio` | Private object storage for uploads |
| `rag4all-api` | FastAPI + widget JS (`mohds5252/rag4all-api`) |
| `rag4all-worker` | Background worker (same API image) |
| `rag4all-platform-ui` | Dashboard + landing (`mohds5252/rag4all-platform-ui`) |

**Not used on Render:** Caddy (Render handles TLS), setup-wizard, admin-ui.

## Files to use

| File | Purpose |
| ---- | ------- |
| **`deploy/saas/render.yaml`** | Blueprint — defines all Render services |
| **`deploy/saas/.env.render.example`** | Env vars reference (most wired automatically) |
| **`deploy/saas/render-init-db.sql`** | One-time Postgres extensions (pgvector) |
| `deploy/saas/.env.saas.example` | Same env semantics as local SaaS compose |

**Do not use:** `rag4all-deploy/docker-compose.yml` (single-tenant only).

## Prerequisites

- [Render](https://render.com) account (paid plans recommended — ~6 billable resources)
- GitHub repo with this codebase
- Docker Hub images published: `mohds5252/rag4all-api`, `mohds5252/rag4all-platform-ui`
- Domain for custom URLs (optional at first — use `*.onrender.com` to test)

## Step 1 — Deploy Blueprint

1. Push repo to GitHub (e.g. `mdvohra/RAG_service`).
2. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
3. Connect the repo.
4. Set **Blueprint file path:** `deploy/saas/render.yaml`
5. When prompted, set:

   | Variable | Example |
   | -------- | ------- |
   | `PLATFORM_URL` | `https://app.yourdomain.com` |
   | `API_PUBLIC_URL` | `https://api.yourdomain.com` |
   | `SITE_URL` | `https://app.yourdomain.com` |
   | `API_PUBLIC_URL` (platform-ui) | same as above |

6. Click **Apply** — Render creates Postgres, Redis, MinIO, API, Worker, and Platform UI.

First API deploy runs migrations and seeds the platform (~2–3 min).

## Step 2 — Enable pgvector

Render Postgres does not auto-install pgvector. After `rag4all-db` is live:

1. Open **rag4all-db** → **Shell** (or connect via psql).
2. Run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

Or paste contents of `deploy/saas/render-init-db.sql`.

3. **Redeploy `rag4all-api`** if the first deploy failed on migrations.

## Step 3 — Custom domains

| Service | Custom domain |
| ------- | ------------- |
| `rag4all-platform-ui` | `app.yourdomain.com` |
| `rag4all-api` | `api.yourdomain.com` |

Render Dashboard → each service → **Settings** → **Custom Domains** → add DNS records as shown.

Update env if URLs change:

- `PLATFORM_URL`, `API_PUBLIC_URL`, `SITE_URL` on API + Worker (env group)
- `API_PUBLIC_URL` on platform-ui

## Step 4 — Verify

```bash
curl https://api.yourdomain.com/v1/health
# → {"status":"ok"} or similar

open https://app.yourdomain.com
# → Sign up, onboarding, upload docs, embed widget
```

Widget embed (per customer):

```html
<script
  src="https://api.yourdomain.com/widget/v1/embed.js"
  data-widget-key="wk_..."
  data-api-url="https://api.yourdomain.com"
  data-site-url="https://customer-site.com"
  async></script>
```

## Environment reference

Secrets (`SECRET_KEY`, `ENCRYPTION_KEY`, `SUPER_ADMIN_API_KEY`) are **auto-generated** by the Blueprint.

| Variable | Source |
| -------- | ------ |
| `DATABASE_URL` | Render Postgres (start command adds `+asyncpg`) |
| `REDIS_URL` | Render Key Value |
| `MINIO_*` | Private MinIO service (internal network) |
| `PLATFORM_URL` / `API_PUBLIC_URL` / `SITE_URL` | You set on first deploy |
| LLM keys | **Per tenant (BYOK)** — operator does not need platform LLM keys |

See `.env.render.example` for the full list.

## Plans & cost (approximate)

| Resource | Blueprint plan |
| -------- | -------------- |
| Postgres | `basic-256mb` |
| Redis, API, Worker, UI, MinIO | `starter` each |

Expect **~$35–50+/month** depending on Render pricing and scaling. Upgrade worker to **Standard** (2 GB+) if document processing is slow.

## Troubleshooting

| Issue | Fix |
| ----- | --- |
| API crash on start | Run pgvector SQL, redeploy API |
| Upload fails | Check MinIO disk attached; verify `MINIO_ENDPOINT` in API env |
| Platform UI blank / API errors | Set `API_PUBLIC_URL` on platform-ui to public API URL |
| CORS errors | Ensure `PLATFORM_URL` and `SITE_URL` match your domains |
| Worker not processing | Check `REDIS_URL`; scale worker plan if OOM |

## Updating images

After pushing new images to Docker Hub:

1. Render Dashboard → each service → **Manual Deploy** → **Clear build cache & deploy**
2. Or enable **Auto-Deploy** if using repo-based deploy (Blueprint uses pinned image tags — redeploy to pull `:latest`).

## Local SaaS dev (before Render)

```bash
cp deploy/saas/.env.saas.example .env
docker compose -f docker-compose.yml -f deploy/docker-compose.saas.yml -f deploy/docker-compose.saas.local.yml up -d --build
```

See [deploy/saas/README.md](./README.md).
