#!/bin/bash
# Test memory optimizations locally before deploying

set -e

echo "🧪 Testing Memory-Optimized Vibrato Analyzer Locally"
echo "====================================================="
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 not found"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "backend.py" ]; then
    echo "❌ Error: backend.py not found. Run this script from the project root."
    exit 1
fi

echo "📦 Checking dependencies..."
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing/updating dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

echo ""
echo "✓ Dependencies installed"
echo ""

# Set memory optimization environment variables
export PYTHONUNBUFFERED=1
export PYTHONDONTWRITEBYTECODE=1
export PYTHONOPTIMIZE=1
export OMP_NUM_THREADS=1
export OPENBLAS_NUM_THREADS=1
export MKL_NUM_THREADS=1
export NUMEXPR_NUM_THREADS=1

echo "🔧 Environment variables set:"
echo "   PYTHONUNBUFFERED=1"
echo "   PYTHONOPTIMIZE=1"
echo "   *_NUM_THREADS=1 (single-threaded numpy/scipy)"
echo ""

# Optional: Install memory profiler
read -p "📊 Install memory_profiler for detailed memory tracking? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    pip install -q memory-profiler
    MEMORY_PROFILER_INSTALLED=1
    echo "✓ memory_profiler installed"
else
    MEMORY_PROFILER_INSTALLED=0
fi

echo ""
echo "🚀 Starting server..."
echo "   Access at: http://localhost:8000"
echo "   API docs: http://localhost:8000/docs"
echo ""
echo "📝 Test with sample files:"
if [ -d "sample-audio" ]; then
    echo "   Available samples:"
    ls -lh sample-audio/*.wav 2>/dev/null | awk '{print "   - " $9 " (" $5 ")"}'
fi
echo ""
echo "🧪 Memory testing tips:"
echo "   1. Open http://localhost:8000 in browser"
echo "   2. Upload a sample audio file"
echo "   3. Watch the console for memory info"
echo "   4. Try multiple uploads to test memory cleanup"
if [ $MEMORY_PROFILER_INSTALLED -eq 1 ]; then
    echo "   5. Check memory_profiler output for detailed analysis"
fi
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
if [ $MEMORY_PROFILER_INSTALLED -eq 1 ]; then
    python -m memory_profiler backend.py
else
    python -O backend.py
fi

