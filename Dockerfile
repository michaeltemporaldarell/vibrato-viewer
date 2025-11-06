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
COPY start.sh .

# Make start script executable
RUN chmod +x start.sh

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/vibrato-viewer/dist ./vibrato-viewer/dist

# Expose port (Railway will override with $PORT)
EXPOSE 8000

# Use entrypoint script
CMD ["./start.sh"]

