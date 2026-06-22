#!/bin/sh
set -e

API_URL="${API_PUBLIC_URL:-http://localhost:8000}"
ADMIN_URL="${ADMIN_PUBLIC_URL:-http://localhost:8090}"
SAMPLE_URL="${SAMPLE_SITE_URL:-http://localhost:3000}"
WKEY="${WIDGET_KEY:-wk_dev_widget_key_change_me}"
AKEY="${API_KEY:-rag_dev_api_key_change_me}"

cat > /usr/share/nginx/html/config.js <<EOF
window.__RAG_EMBED_CONFIG__ = {
  apiUrl: "${API_URL}",
  apiKey: "${AKEY}",
  widgetKey: "${WKEY}",
  adminUrl: "${ADMIN_URL}",
  sampleSiteUrl: "${SAMPLE_URL}"
};
EOF

exec nginx -g "daemon off;"
