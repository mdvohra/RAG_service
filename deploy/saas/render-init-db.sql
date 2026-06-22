-- Run once in Render Postgres shell after first deploy (required for RAG)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
