# Multi-stage build for Vibrato Analyzer
# Stage 1: Build frontend
FROM node:18-slim AS frontend-builder

WORKDIR /app/vibrato-viewer
COPY vibrato-viewer/package*.json ./
RUN npm ci
COPY vibrato-viewer/ ./
RUN npm run build

# Stage 2: Python backend with built frontend
FROM python:3.9-slim

# Install system dependencies for audio processing
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend.py .

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/vibrato-viewer/dist ./vibrato-viewer/dist

# Expose port (Railway will override with $PORT)
EXPOSE 8000

# Start command (use shell form for environment variable expansion)
CMD ["sh", "-c", "uvicorn backend:app --host 0.0.0.0 --port ${PORT:-8000}"]

