#!/bin/sh
set -e
API_URL="${API_PUBLIC_URL:-http://localhost:8000}"
cat > /usr/share/nginx/html/config.js <<EOF
window.__RAG_PLATFORM_CONFIG__ = { apiUrl: "${API_URL}" };
EOF
exec nginx -g "daemon off;"
