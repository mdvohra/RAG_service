# SaaS hosted deployment

Run RAG4All as a multi-tenant platform on your domain. Customers sign up at `app.yourdomain.com`, configure their LLM keys, upload docs, and embed the widget on their websites.

## DNS

| Record | Points to |
|--------|-----------|
| `app.yourdomain.com` | Your server / load balancer |
| `api.yourdomain.com` | Same |

## Local development (localhost)

```bash
cp deploy/saas/.env.saas.example .env
# Edit .env — set DOMAIN=localhost, PLATFORM_URL=http://app.localhost, etc.

docker compose -f docker-compose.yml -f deploy/docker-compose.saas.yml -f deploy/docker-compose.saas.local.yml up -d --build
```

Or on Windows: `deploy\saas\local-up.bat`

| URL | Service |
|-----|---------|
| http://app.localhost | Platform UI (via Caddy) |
| http://localhost:3001 | Platform UI (direct) |
| http://api.localhost | API (via Caddy) |
| http://localhost:8000 | API (direct) |

Set `SITE_URL=http://localhost:3000` and `SITE_URL_ALLOW_LOCALHOST=true` for widget testing on sample site.

## Deploy (build from source)

```bash
cp deploy/saas/.env.saas.example .env
# Edit SECRET_KEY, ENCRYPTION_KEY, DOMAIN, PLATFORM_URL, API_PUBLIC_URL

docker compose -f docker-compose.yml -f deploy/docker-compose.saas.yml up -d --build
```

## Docker Hub (deploy anywhere)

Publish images once from your dev machine, then run the stack on any server with only Docker — no repo clone required.

### 1. Publish images

```bash
docker login
export DOCKERHUB_USER=yourusername   # Windows: $env:DOCKERHUB_USER = "yourusername"
./deploy/saas/push-images.sh
```

Or on Windows:

```powershell
docker login
$env:DOCKERHUB_USER = "yourusername"
.\deploy\saas\push-images.ps1
```

Images pushed:

| Image | Used by |
|-------|---------|
| `{user}/rag4all-api:latest` | `api`, `worker` (widget embed included) |
| `{user}/rag4all-platform-ui:latest` | `platform-ui` |

Optional version tag: `push-images.ps1 -Tag v1.0.0`

### 2. Run on any server

Copy the `deploy/saas/` folder to the server (or clone the repo). You need:

- `docker-compose.hub.yml`
- `Caddyfile`
- `init-db.sql`
- `.env` (from `.env.hub.example`)

```bash
cp .env.hub.example .env
# Edit DOCKERHUB_USER, SECRET_KEY, ENCRYPTION_KEY, DOMAIN, PLATFORM_URL, API_PUBLIC_URL

docker login   # if images are private
docker compose -f docker-compose.hub.yml pull
docker compose -f docker-compose.hub.yml up -d
```

Point DNS `app.{DOMAIN}` and `api.{DOMAIN}` to the server. Caddy terminates TLS automatically.

### Pull with full repo (alternative)

If you already have the repo on the server and only want pre-built app images:

```bash
# .env must include DOCKERHUB_USER=yourusername
docker compose -f docker-compose.yml -f deploy/docker-compose.saas.yml \
  -f deploy/docker-compose.saas.images.yml pull
docker compose -f docker-compose.yml -f deploy/docker-compose.saas.yml \
  -f deploy/docker-compose.saas.images.yml up -d
```

## Customer flow

1. Sign up at `https://app.{DOMAIN}`
2. Complete onboarding (website URL, LLM API key, test connection)
3. Upload documents
4. Copy embed snippet from Embed page
5. Paste on their website — widget calls `https://api.{DOMAIN}`

## Embed snippet (per customer)

```html
<script
  src="https://api.yourdomain.com/widget/v1/embed.js"
  data-widget-key="wk_..."
  data-api-url="https://api.yourdomain.com"
  data-site-url="https://customer-site.com"
  async></script>
```

## Operator admin

Create tenants manually (optional):

```bash
curl -X POST https://api.yourdomain.com/v1/admin/tenants \
  -H "Authorization: Bearer $SUPER_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme","site_url":"https://acme.com"}'
```

Normal customers use `/v1/auth/signup` instead.

## vs on-prem

| | SaaS | On-prem |
|--|------|---------|
| Compose overlay | `deploy/docker-compose.saas.yml` | `deploy/docker-compose.onprem.yml` |
| Login | Yes | No (setup wizard) |
| LLM keys | Per tenant (BYOK) | Global `.env` |
| UI | `platform-ui` | `setup-wizard` + `admin-ui` |
