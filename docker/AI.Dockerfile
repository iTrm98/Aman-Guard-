# AmanGuard AI engine (FastAPI + OpenAI).
# Build context: the AI/ folder.
#   docker build -f docker/AI.Dockerfile -t amanguard-ai AI
#
# The script's own __main__ binds 127.0.0.1, which is unreachable from other
# containers — so the image starts uvicorn directly on 0.0.0.0 instead.
# OPENAI_API_KEY comes from the environment (docker-compose passes it through);
# without it the engine answers with its cautious fallback and the backend
# falls back to rule-based scoring. The AI/.env file (the real key) is kept
# out of the image by AI/.dockerignore AND by copying only phishingGPT.py.

FROM python:3.12-slim
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY phishingGPT.py .

EXPOSE 8000
CMD ["uvicorn", "phishingGPT:app", "--host", "0.0.0.0", "--port", "8000"]
