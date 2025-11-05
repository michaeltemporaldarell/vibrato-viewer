# Quick Start Guide 🚀

Get the Vibrato Viewer up and running in 3 simple steps!

## Step 1: Install Backend Dependencies

```bash
# Activate your virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install new dependencies (FastAPI, uvicorn, python-multipart)
pip install -r requirements.txt
```

## Step 2: Start the Backend

```bash
# From the project root directory
uvicorn backend:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## Step 3: Start the Frontend

Open a **new terminal** window and run:

```bash
cd vibrato-viewer
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## That's it! 🎉

Open your browser and navigate to **http://localhost:5173**

Upload a WAV file and watch the magic happen! The app will automatically:
1. Upload the file to the backend
2. Analyze the audio for vibrato characteristics
3. Display beautiful, real-time scrolling visualizations

---

## Troubleshooting

### Backend won't start
- Make sure you activated the virtual environment
- Check that all dependencies installed: `pip list | grep fastapi`
- Try: `pip install --upgrade fastapi uvicorn python-multipart`

### Frontend won't start
- Make sure you're in the `vibrato-viewer` directory
- Check node_modules exist: `ls vibrato-viewer/node_modules`
- Try: `cd vibrato-viewer && npm install`

### "Failed to analyze audio" error
- Make sure the backend is running (check http://localhost:8000/health)
- Check backend terminal for error messages
- Try a different audio file (WAV files work best)

### CORS errors
- Make sure both frontend and backend are running
- Frontend should be on port 5173, backend on port 8000
- Try clearing browser cache and reloading

---

## Using the One-Line Startup Script

Instead of running two terminals, you can use the startup script:

```bash
# Make executable (first time only)
chmod +x start.sh

# Run it
./start.sh
```

This will start both servers and show logs. Press `Ctrl+C` to stop both.

---

## What Changed from the Old Version?

### Before ❌
- Had to manually run `python analyze_audio.py file.wav output.json`
- Upload both the audio file AND the JSON separately
- Two separate manual steps

### Now ✅
- Just upload the audio file
- Analysis happens automatically in the background
- One simple step!

### Design Changes 🎨
- Switched from purple/dark theme to clean Apple-inspired minimalist design
- Light background with subtle shadows
- Blue accents instead of purple
- More whitespace and modern typography
- Smoother animations and interactions

Enjoy your new dynamic vibrato analyzer! 🎵

