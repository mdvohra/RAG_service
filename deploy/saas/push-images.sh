#!/usr/bin/env bash
# Build and push RAG4All SaaS images to Docker Hub.
# Usage:
#   export DOCKERHUB_USER=yourusername
#   ./deploy/saas/push-images.sh
#   ./deploy/saas/push-images.sh yourusername v1.0.0

set -euo pipefail

USER="${1:-${DOCKERHUB_USER:-}}"
TAG="${2:-${RAG4ALL_VERSION:-latest}}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

if [[ -z "$USER" ]]; then
  echo "Set DOCKERHUB_USER or pass username as first argument" >&2
  exit 1
fi

API_IMAGE="${USER}/rag4all-api:${TAG}"
UI_IMAGE="${USER}/rag4all-platform-ui:${TAG}"
WIZARD_IMAGE="${USER}/rag4all-setup-wizard:${TAG}"
ADMIN_IMAGE="${USER}/rag4all-admin-ui:${TAG}"

echo "Building ${API_IMAGE} ..."
docker build -f "${ROOT}/backend/Dockerfile" -t "${API_IMAGE}" "${ROOT}"

echo "Building ${UI_IMAGE} ..."
docker build -t "${UI_IMAGE}" "${ROOT}/platform-ui"

echo "Building ${WIZARD_IMAGE} ..."
docker build -t "${WIZARD_IMAGE}" "${ROOT}/setup-wizard"

echo "Building ${ADMIN_IMAGE} ..."
docker build -t "${ADMIN_IMAGE}" "${ROOT}/admin-ui"

echo "Pushing ${API_IMAGE} ..."
docker push "${API_IMAGE}"

echo "Pushing ${UI_IMAGE} ..."
docker push "${UI_IMAGE}"

echo "Pushing ${WIZARD_IMAGE} ..."
docker push "${WIZARD_IMAGE}"

echo "Pushing ${ADMIN_IMAGE} ..."
docker push "${ADMIN_IMAGE}"

echo ""
echo "Done. Images published:"
echo "  ${API_IMAGE}   (api + worker)"
echo "  ${UI_IMAGE}   (SaaS platform-ui)"
echo "  ${WIZARD_IMAGE}   (single-tenant setup)"
echo "  ${ADMIN_IMAGE}   (single-tenant admin)"
