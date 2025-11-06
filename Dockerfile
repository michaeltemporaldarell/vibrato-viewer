# Multi-stage build for Vibrato Analyzer (Memory Optimized)
# Stage 1: Build frontend
FROM node:18-slim AS frontend-builder

WORKDIR /app/vibrato-viewer
COPY vibrato-viewer/package*.json ./
RUN npm ci --omit=dev
COPY vibrato-viewer/ ./
RUN npm run build

# Stage 2: Python backend with built frontend (Memory Optimized)
FROM python:3.11-slim

# Memory optimization environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONOPTIMIZE=1 \
    # Reduce numpy/scipy thread usage to save memory
    OMP_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    NUMEXPR_NUM_THREADS=1

# Install system dependencies for audio processing (minimal set)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

WORKDIR /app

# Install Python dependencies with no cache to save space
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    # Remove pip cache and unnecessary files
    rm -rf ~/.cache/pip && \
    find /usr/local/lib/python3.11 -name '*.pyc' -delete && \
    find /usr/local/lib/python3.11 -name '__pycache__' -type d -exec rm -rf {} + 2>/dev/null || true

# Copy backend code
COPY backend.py .

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/vibrato-viewer/dist ./vibrato-viewer/dist

# Expose port (Railway will override with $PORT)
EXPOSE 8000

# Start with Python directly - it reads $PORT from environment
CMD ["python", "-O", "backend.py"]

