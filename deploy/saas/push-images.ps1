# Build and push RAG4All SaaS images to Docker Hub.
# Usage:
#   $env:DOCKERHUB_USER = "yourusername"
#   .\deploy\saas\push-images.ps1
#   .\deploy\saas\push-images.ps1 -User yourusername -Tag v1.0.0

param(
    [string]$User = $env:DOCKERHUB_USER,
    [string]$Tag = $env:RAG4ALL_VERSION
)

if (-not $User) {
    Write-Error "Set DOCKERHUB_USER or pass -User your-dockerhub-username"
    exit 1
}
if (-not $Tag) { $Tag = "latest" }

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$apiImage = "${User}/rag4all-api:${Tag}"
$uiImage = "${User}/rag4all-platform-ui:${Tag}"

Write-Host "Building $apiImage ..."
docker build -f (Join-Path $root "backend\Dockerfile") -t $apiImage $root

Write-Host "Building $uiImage ..."
docker build -t $uiImage (Join-Path $root "platform-ui")

Write-Host "Pushing $apiImage ..."
docker push $apiImage

Write-Host "Pushing $uiImage ..."
docker push $uiImage

Write-Host ""
Write-Host "Done. Images published:"
Write-Host "  $apiImage   (api + worker)"
Write-Host "  $uiImage"
Write-Host ""
Write-Host "Deploy on any server:"
Write-Host "  1. Copy deploy/saas/ to the server"
Write-Host "  2. cp .env.hub.example .env  (set DOCKERHUB_USER, DOMAIN, secrets)"
Write-Host "  3. docker login"
Write-Host "  4. docker compose -f docker-compose.hub.yml pull"
Write-Host "  5. docker compose -f docker-compose.hub.yml up -d"
