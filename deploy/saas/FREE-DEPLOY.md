# Deploy RAG4All SaaS for FREE

Render asked for payment because **`render.yaml` uses paid plans** (Postgres `basic-256mb`, Redis, MinIO, Worker, Starter web services). A full SaaS stack cannot run 100% free on Render alone.

Here are your realistic free options, best first.

---

## Option 1 — Free VM + Docker Compose (recommended, truly free)

Run the full SaaS stack on a **free cloud VM** with your existing Docker Hub images. No Render payment.

| Provider | Free tier |
| -------- | --------- |
| [Oracle Cloud Always Free](https://www.oracle.com/cloud/free/) | ARM VM, 24 GB RAM, forever free |
| [Google Cloud](https://cloud.google.com/free) | e2-micro (limited) |
| Your PC + [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) | Free, exposes localhost to internet |

### Steps (Oracle Cloud example)

1. Create a free ARM instance (Ubuntu 22.04).
2. Install Docker:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

3. Clone or copy deploy files:

```bash
git clone https://github.com/mdvohra/RAG4All.git saas-deploy
cd saas-deploy   # or copy deploy/saas/ from monorepo
```

4. For **full monorepo**, use hub compose from `deploy/saas/`:

```bash
cp .env.hub.example .env
# Edit DOMAIN, SECRET_KEY, ENCRYPTION_KEY, PLATFORM_URL, API_PUBLIC_URL
docker compose -f docker-compose.hub.yml pull
docker compose -f docker-compose.hub.yml up -d
```

5. Point DNS `app.yourdomain.com` and `api.yourdomain.com` to the VM IP.

**Cost: $0/month** (within provider free limits).

---

## Option 2 — Render free tier (demo only, limited)

Use **`deploy/saas/render-free.yaml`** instead of `render.yaml`.

### What is free on Render

| Resource | Free? | Catch |
| -------- | ----- | ----- |
| Web service (`plan: free`) | Yes | Sleeps after 15 min idle; ~750 hrs/month total |
| PostgreSQL (`plan: free`) | Yes | **Deleted after ~30 days** |
| Background worker | **No** | Combined into API container in `render-free.yaml` |
| Redis (Key Value) | **No** | Use [Upstash Redis free](https://upstash.com/) |
| MinIO / private service | **No** | Use [Cloudflare R2 free](https://developers.cloudflare.com/r2/) (10 GB) |

### Before deploying `render-free.yaml`

#### A. Upstash Redis (free)

1. [upstash.com](https://upstash.com) → Create Redis database (free tier).
2. Copy the **Redis URL** (`rediss://...` or `redis://...`).

#### B. Cloudflare R2 (free object storage)

1. Cloudflare dashboard → R2 → Create bucket `documents`.
2. R2 → Manage API tokens → Create token with read/write.
3. Set in Render env when Blueprint prompts:

```env
REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_UPSTASH_HOST:6379
MINIO_ENDPOINT=YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
MINIO_ACCESS_KEY=your_r2_access_key_id
MINIO_SECRET_KEY=your_r2_secret_access_key
MINIO_BUCKET=documents
MINIO_SECURE=true
```

The app uses the MinIO client, which works with R2 (S3-compatible).

#### C. Deploy Blueprint

1. Render → New → Blueprint
2. Blueprint path: **`deploy/saas/render-free.yaml`**
3. Set when prompted:

| Variable | Example |
| -------- | ------- |
| `PLATFORM_URL` | `https://rag4all-platform-ui.onrender.com` |
| `API_PUBLIC_URL` | `https://rag4all-api.onrender.com` |
| `SITE_URL` | same as PLATFORM_URL |
| `REDIS_URL` | Upstash URL |
| `MINIO_*` | R2 credentials |

4. Run `render-init-db.sql` in Postgres shell after first deploy.

### Render free downsides

- Apps **sleep** → first visit after idle takes ~1 minute
- Database **gone after 30 days** unless you upgrade
- Document uploads need R2 configured correctly
- Not suitable for production or beta customers

---

## Option 3 — Local only (free, for development)

Single-tenant local stack (simplest):

```bash
git clone https://github.com/mdvohra/RAG4All.git
cd RAG4All
cp .env.example .env
docker compose pull && docker compose up -d
```

SaaS multi-tenant local (from monorepo):

```bash
cp deploy/saas/.env.saas.example .env
docker compose -f docker-compose.yml -f deploy/docker-compose.saas.yml -f deploy/docker-compose.saas.local.yml up -d --build
```

**Cost: $0** — runs on your machine only.

---

## Which file to use?

| Goal | File |
| ---- | ---- |
| Production SaaS on Render (paid) | `deploy/saas/render.yaml` |
| Demo on Render (free, limited) | `deploy/saas/render-free.yaml` |
| Free production SaaS | `deploy/saas/docker-compose.hub.yml` on Oracle/GCP free VM |
| Local single-tenant | `rag4all-deploy/docker-compose.yml` |
| Local SaaS dev | `docker-compose.yml` + `deploy/docker-compose.saas.yml` |

---

## Why Render asked for payment

Your `render.yaml` creates **6 paid resources**:

1. Postgres `basic-256mb` (~$6/mo)
2. Redis starter (~$10/mo)
3. MinIO private service + disk (~$7+/mo)
4. API starter (~$7/mo)
5. Worker starter (~$7/mo)
6. Platform UI starter (~$7/mo)

**Total ≈ $35–50+/month.** Render requires a card for these.

For **$0**, use **Option 1** (free VM + Docker Compose) or **Option 2** (Render free + Upstash + R2) for a time-limited demo.
