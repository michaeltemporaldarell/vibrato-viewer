#!/bin/bash
# Test Docker build locally before deploying

echo "🐋 Building Docker image..."
docker build -t vibrato-analyzer .

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"
echo ""
echo "🚀 Starting container on port 8000..."
docker run -p 8000:8000 -e PORT=8000 vibrato-analyzer

# To test with a different port:
# docker run -p 8080:8080 -e PORT=8080 vibrato-analyzer

