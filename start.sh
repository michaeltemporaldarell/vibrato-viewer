#!/bin/bash

# Vibrato Viewer Startup Script
# This script starts both the backend and frontend servers

echo "🎵 Starting Vibrato Viewer..."
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run:"
    echo "   python3 -m venv venv"
    echo "   source venv/bin/activate"
    echo "   pip install -r requirements.txt"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "vibrato-viewer/node_modules" ]; then
    echo "❌ Node modules not found. Please run:"
    echo "   cd vibrato-viewer && npm install"
    exit 1
fi

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Register cleanup function to run on script exit
trap cleanup SIGINT SIGTERM

# Activate virtual environment
source venv/bin/activate

# Start the backend
echo "🚀 Starting FastAPI backend on http://localhost:8000"
uvicorn backend:app --reload --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start the frontend
echo "🎨 Starting React frontend on http://localhost:5173"
cd vibrato-viewer
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Vibrato Viewer is running!"
echo ""
echo "   Frontend:     http://localhost:5173"
echo "   Backend API:  http://localhost:8000"
echo "   API Docs:     http://localhost:8000/docs"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for background processes
wait

