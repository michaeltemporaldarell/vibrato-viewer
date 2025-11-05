# 🎵 Vibrato Viewer

Real-time scrolling vibrato analysis with a beautiful, interactive interface. Watch the vibrato graph "write" itself as the audio plays - like a seismograph for singing!

## ✨ Features

- **Real-time Scrolling Visualization** - Graphs draw as the audio plays, scrolling from right to left
- **Three Synchronized Graphs**:
  - Pitch Deviation (vibrato oscillation in cents)
  - Volume Envelope (amplitude over time)
  - Pitch-Volume Correlation (normalized overlay)
- **Interactive Playback Controls** - Play, pause, restart, and scrub through audio
- **Adjustable Zoom** - Change the time window to see more or less context
- **Live Statistics** - Oscillation count, vibrato rate, and correlation coefficients
- **Modern UI** - Beautiful gradient design with smooth animations

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- Python 3.8+ with librosa, numpy, scipy

### Installation

1. **Install Python dependencies** (if you haven't already):
```bash
cd /Users/michaeltemporaldarell/Documents/singing-thing
source venv/bin/activate
pip install numpy librosa matplotlib scipy
```

2. **Install Node dependencies**:
```bash
cd vibrato-viewer
npm install
```

### Running the App

1. **Start the development server**:
```bash
npm run dev
```

2. **Open your browser** to `http://localhost:3000`

3. **Upload an audio file** and watch the magic happen!

## 📊 How It Works

### The "Writing" Effect

The visualization uses a **scrolling window** approach:
- The playhead stays fixed on the right side
- The graph scrolls from right to left as audio plays
- Only a small time window (2-10 seconds) is visible at once
- This creates the effect of the graph "writing" itself in real-time

### Analysis Pipeline

1. **Audio Upload** → User selects a WAV/MP3/FLAC file
2. **Pitch Extraction** → pYIN algorithm extracts fundamental frequency
3. **Vibrato Detection** → Finds peaks and troughs in pitch deviation
4. **Amplitude Analysis** → Calculates RMS energy envelope
5. **Correlation** → Computes relationship between pitch and volume
6. **Real-time Rendering** → Canvas-based visualization with 60 FPS scrolling

## 🔧 Integration with Python Backend

For production use with real audio analysis (not mock data):

### Option 1: Pre-analyze Audio Files

```bash
# Analyze an audio file and save JSON
python analyze_audio.py your-audio.wav output.json

# Then load the JSON in the React app
```

### Option 2: Add a Backend API

Create a simple Flask/FastAPI server:

```python
from flask import Flask, request, jsonify
from analyze_audio import analyze_audio_file
import tempfile

app = Flask(__name__)

@app.route('/analyze', methods=['POST'])
def analyze():
    file = request.files['audio']
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        file.save(tmp.name)
        result = analyze_audio_file(tmp.name)
    return jsonify(result)

if __name__ == '__main__':
    app.run(port=5000)
```

Then update `App.tsx` to call this endpoint instead of using mock data.

## 🎨 Customization

### Adjust Scroll Speed

In `ScrollingVibratoGraph.tsx`:
```typescript
const SCROLL_SPEED = 1 // Change this value
```

### Change Colors

Update the color scheme in the `drawPitchDeviation`, `drawAmplitude`, etc. functions.

### Modify Window Size

The default scrolling window is 5 seconds. Users can adjust this with the slider, or you can change the default:

```typescript
const [windowSize, setWindowSize] = useState(5) // Change default here
```

## 🎯 Tips for Best Results

1. **Use vocal-only recordings** for clearest vibrato analysis
2. **Adjust zoom** - Smaller windows (2-3s) for detailed analysis, larger (8-10s) for context
3. **Look for sustained notes** - Vibrato is most apparent on held notes
4. **Check correlation** - Positive values indicate synchronized pitch-volume technique

## 📝 Tech Stack

- **React 18** with TypeScript
- **Vite** for blazing-fast dev server
- **Tailwind CSS** for styling
- **Canvas API** for high-performance rendering
- **Python + librosa** for audio analysis
- **Web Audio API** for playback

## 🐛 Troubleshooting

### Graphs not rendering
- Check browser console for errors
- Ensure audio file is loaded properly
- Try refreshing the page

### Analysis taking too long
- Use shorter audio files for testing
- Consider downsampling very high sample rate files

### npm permission errors
- Run: `sudo chown -R $(whoami) ~/.npm`
- Or use `npm install --user`

## 🚀 Future Enhancements

- [ ] Real-time audio input (microphone)
- [ ] Export visualization as video
- [ ] Compare multiple singers side-by-side
- [ ] Machine learning vibrato classification
- [ ] Spectral analysis overlay

## 📄 License

MIT License - Feel free to use and modify!

## 🎤 Perfect for Analyzing

- Opera singers (Caruso, Pavarotti, etc.)
- Vocal pedagogy and training
- Music research and musicology
- Comparing vocal techniques across eras
- Understanding vibrato patterns

Enjoy analyzing beautiful singing! 🎵

