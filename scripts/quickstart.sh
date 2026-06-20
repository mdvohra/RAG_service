#!/bin/sh
set -e
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

docker compose --profile local-llm up -d --build
echo ""
echo "RAG Embed is starting..."
echo "  API:          http://localhost:8000"
echo "  API Docs:     http://localhost:8000/docs"
echo "  Setup Wizard: http://localhost:8080"
echo "  MinIO Console: http://localhost:9001 (minioadmin/minioadmin)"
