# Widget embed bundle (served at /widget/v1/embed.js)
FROM node:20-alpine AS widget-build
WORKDIR /widget
COPY widget/package.json widget/package-lock.json* ./
RUN npm install
COPY widget/ .
RUN npm run build

FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

COPY --from=widget-build /widget/dist /app/widget/dist

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8000/v1/health || exit 1

EXPOSE 8000
