@echo off
REM Start RAG Embed SaaS stack on localhost
cd /d "%~dp0\..\.."
echo Starting SaaS stack (app.localhost + api.localhost)...
docker compose -f docker-compose.yml -f deploy/docker-compose.saas.yml -f deploy/docker-compose.saas.local.yml up -d --build
echo.
echo Waiting for API health...
timeout /t 15 /nobreak >nul
curl -s http://api.localhost/v1/health || curl -s http://localhost:8000/v1/health
echo.
echo Platform UI:  http://app.localhost  (or http://localhost:3001)
echo API:            http://api.localhost  (or http://localhost:8000)
echo API docs:       http://localhost:8000/docs
echo.
echo Sample site:    cd sample-site && python -m http.server 3000
