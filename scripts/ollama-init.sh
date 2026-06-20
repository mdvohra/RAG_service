#!/bin/sh
set -e

if [ "${OLLAMA_AUTO_PULL:-true}" != "true" ]; then
  echo "OLLAMA_AUTO_PULL disabled, skipping model pull"
  exit 0
fi

echo "Waiting for Ollama at ${OLLAMA_HOST:-http://ollama:11434}..."
until ollama list >/dev/null 2>&1; do
  sleep 2
done

if [ -n "${LLM_MODEL}" ]; then
  echo "Pulling LLM model: ${LLM_MODEL}"
  ollama pull "${LLM_MODEL}" || echo "Warning: failed to pull ${LLM_MODEL}"
fi

if [ -n "${EMBEDDING_MODEL}" ]; then
  echo "Pulling embedding model: ${EMBEDDING_MODEL}"
  ollama pull "${EMBEDDING_MODEL}" || echo "Warning: failed to pull ${EMBEDDING_MODEL}"
fi

echo "Ollama init complete"
ollama list
