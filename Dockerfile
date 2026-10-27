# Multi-stage Production Dockerfile for OptiVest AI Version 1.0

# -------------------------------------------------------------
# Stage 1: Build Frontend React Bundle
# -------------------------------------------------------------
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --silent
COPY frontend/ ./
RUN npm run build

# -------------------------------------------------------------
# Stage 2: Build Python Backend Environment
# -------------------------------------------------------------
FROM python:3.10-slim AS backend
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    ENVIRONMENT=production

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ /app/backend/
COPY audit_platform.py /app/

# Copy built frontend static dist into backend static directory
COPY --from=frontend-builder /app/frontend/dist /app/frontend_dist

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
