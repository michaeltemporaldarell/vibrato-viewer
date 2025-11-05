# Vibrato Viewer 🎵

A beautiful, modern web application for analyzing and visualizing vibrato in singing recordings. Built with a Python FastAPI backend and React TypeScript frontend with an Apple-inspired minimalist design.

## Features

- 🎤 **Real-time Audio Analysis** - Upload WAV, MP3, FLAC, or other audio formats
- 📊 **Interactive Visualization** - Scrolling graphs showing pitch deviation, volume, and correlation
- 🎨 **Modern UI** - Clean, Apple-inspired design with smooth animations
- ⚡ **Fast Analysis** - Powered by librosa for accurate pitch detection
- 🔄 **Dynamic Processing** - No need to run separate analysis scripts

## Architecture

### Backend (Python + FastAPI)
- FastAPI server for handling file uploads and analysis
- Librosa for audio processing and pitch detection
- pYIN algorithm for accurate pitch tracking
- Automatic vibrato detection and measurement

### Frontend (React + TypeScript + Vite)
- React with TypeScript for type safety
- Tailwind CSS for styling
- Canvas-based visualization for smooth performance
- Real-time playback synchronization

## 🚀 Quick Start

### Option 1: Deploy to Vercel (Recommended for sharing)

The easiest way to get started is to deploy to Vercel for free:

1. Push your code to GitHub
2. Import to [Vercel](https://vercel.com/new)
3. Deploy! (Vercel auto-detects the config)

See **[DEPLOY.md](DEPLOY.md)** for detailed deployment instructions.

### Option 2: Local Development

For local development and testing:

#### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

### Installation

1. **Install Python Dependencies**
```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

2. **Install Frontend Dependencies**
```bash
cd vibrato-viewer
npm install
```

### Running the Application

#### Option 1: Manual Start (Two Terminals)

**Terminal 1 - Start the Backend:**
```bash
# From the project root, with venv activated
uvicorn backend:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Start the Frontend:**
```bash
cd vibrato-viewer
npm run dev
```

#### Option 2: Using the Start Script

```bash
# Make the script executable (first time only)
chmod +x start.sh

# Run the script
./start.sh
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Usage

1. Open the frontend in your browser (http://localhost:5173)
2. Click the upload area or drag and drop an audio file (WAV, MP3, FLAC, etc.)
3. The app will automatically analyze the audio and display:
   - **Pitch Deviation Graph**: Shows vibrato oscillations in cents
   - **Volume Graph**: Displays amplitude envelope
   - **Correlation Graph**: Shows relationship between pitch and volume
4. Use the audio controls to play/pause and navigate the audio
5. Adjust the scroll window size to zoom in or out

That's it! No manual analysis or JSON file uploads needed - everything happens automatically.

## API Endpoints

### `POST /analyze`
Upload an audio file for vibrato analysis.

**Request:**
- Content-Type: multipart/form-data
- Body: Audio file (WAV, MP3, FLAC, etc.)

**Response:**
```json
{
  "times": [0.0, 0.01, 0.02, ...],
  "pitchDeviation": [-10.5, 15.2, ...],
  "amplitude": [0.1, 0.3, 0.5, ...],
  "peaks": [50, 120, 190, ...],
  "troughs": [85, 155, 225, ...],
  "oscillations": 45,
  "duration": 23.5,
  "sampleRate": 44100
}
```

### `GET /health`
Health check endpoint.

## Technology Stack

**Backend:**
- FastAPI - Modern, fast web framework
- Uvicorn - ASGI server
- Librosa - Audio analysis library
- NumPy & SciPy - Numerical computing
- python-multipart - File upload handling

**Frontend:**
- React 18 - UI framework
- TypeScript - Type safety
- Vite - Build tool and dev server
- Tailwind CSS - Utility-first styling
- Lucide React - Icon library
- HTML5 Canvas - High-performance visualization

## Color Palette

The app uses an Apple-inspired minimalist color scheme:
- **Primary Blue**: `#3b82f6` (iOS blue)
- **Success Green**: `#10b981`
- **Warning Amber**: `#f59e0b`
- **Error Red**: `#ef4444`
- **Gray Scale**: `#f9fafb`, `#e5e7eb`, `#9ca3af`, `#111827`

## Development

### Backend Development
```bash
# Run with auto-reload
uvicorn backend:app --reload

# Run tests (if implemented)
pytest
```

### Frontend Development
```bash
cd vibrato-viewer
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Project Structure

```
singing-thing/
├── api/                   # Vercel serverless functions
│   ├── analyze.py        # Analysis API endpoint
│   └── requirements.txt  # Python dependencies for serverless
├── backend.py            # FastAPI backend (local dev)
├── requirements.txt      # Python dependencies (local dev)
├── vercel.json           # Vercel deployment config
├── start.sh              # Local startup script
├── README.md             # This file
├── DEPLOY.md             # Deployment guide
├── analyze_audio.py      # Standalone CLI analysis (legacy)
├── vibrato-viewer/       # Frontend application
│   ├── src/
│   │   ├── App.tsx              # Main application
│   │   ├── components/
│   │   │   └── ScrollingVibratoGraph.tsx
│   │   ├── index.css            # Global styles
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── *.wav                 # Sample audio files
```

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## License

MIT License - feel free to use this project for any purpose.

## Acknowledgments

- Librosa team for the excellent audio analysis library
- FastAPI for the modern Python web framework
- React and Vite teams for the frontend tools

