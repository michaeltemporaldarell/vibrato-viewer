#!/usr/bin/env python3
"""
FastAPI backend for vibrato analysis
Run with: uvicorn backend:app --reload --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import numpy as np
import librosa
from scipy import signal
from scipy.interpolate import interp1d
import tempfile
import os
import json
from pathlib import Path

app = FastAPI(title="Vibrato Analyzer API", version="1.0.0")

# Configure CORS to allow requests from the frontend
# Supports both local development and production (Railway, etc.)
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
allowed_origins = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # Alternative dev port
    frontend_url,             # Production frontend URL
]

# If wildcard is explicitly requested (not recommended for production)
if os.getenv("ALLOW_ALL_ORIGINS", "false").lower() == "true":
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def hz_to_cents(f_hz, f_ref):
    """Convert frequency deviation to cents relative to reference frequency."""
    with np.errstate(divide='ignore', invalid='ignore'):
        cents = 1200 * np.log2(f_hz / f_ref)
        cents[~np.isfinite(cents)] = 0
    return cents

def extract_pitch(y, sr):
    """Extract pitch contour from audio using pYIN algorithm."""
    f0, voiced_flag, voiced_probs = librosa.pyin(
        y, 
        fmin=librosa.note_to_hz('C2'),
        fmax=librosa.note_to_hz('C6'),
        sr=sr,
        frame_length=2048
    )
    
    hop_length = 512
    times = librosa.frames_to_time(
        np.arange(len(f0)), 
        sr=sr, 
        hop_length=hop_length
    )
    
    return f0, times, voiced_flag

def smooth_pitch(f0, window_len=11):
    """Smooth pitch contour to remove noise."""
    valid_mask = ~np.isnan(f0)
    if np.sum(valid_mask) < 2:
        return f0
    
    valid_indices = np.where(valid_mask)[0]
    valid_f0 = f0[valid_mask]
    
    if len(valid_indices) < 2:
        return f0
    
    f = interp1d(valid_indices, valid_f0, kind='linear', 
                 bounds_error=False, fill_value='extrapolate')
    f0_interp = f(np.arange(len(f0)))
    
    if window_len > 1 and len(f0_interp) > window_len:
        window = signal.windows.hann(window_len)
        f0_smooth = signal.convolve(f0_interp, window/window.sum(), mode='same')
    else:
        f0_smooth = f0_interp
    
    return f0_smooth

def detect_vibrato(f0_smooth, times, min_prominence=10.0):
    """Detect vibrato oscillations in pitch contour."""
    window_size = min(50, len(f0_smooth) // 10)
    if window_size < 3:
        window_size = 3
    
    kernel_size = window_size * 2 + 1
    if kernel_size > len(f0_smooth):
        kernel_size = len(f0_smooth) if len(f0_smooth) % 2 == 1 else len(f0_smooth) - 1
    
    f0_mean = signal.medfilt(f0_smooth, kernel_size=kernel_size)
    pitch_deviation_cents = hz_to_cents(f0_smooth, f0_mean)
    
    min_distance = max(3, len(f0_smooth) // 200)
    
    peaks, peak_props = signal.find_peaks(
        pitch_deviation_cents, 
        distance=min_distance, 
        prominence=min_prominence
    )
    troughs, trough_props = signal.find_peaks(
        -pitch_deviation_cents, 
        distance=min_distance, 
        prominence=min_prominence
    )
    
    return pitch_deviation_cents, f0_mean, peaks, troughs

def calculate_amplitude_envelope(y, sr, times):
    """Calculate amplitude envelope and deviation from mean."""
    hop_length = 512
    frame_length = 2048
    
    rms = librosa.feature.rms(
        y=y, 
        frame_length=frame_length, 
        hop_length=hop_length
    )[0]
    
    if len(rms) != len(times):
        f = interp1d(np.linspace(0, 1, len(rms)), rms, kind='linear')
        rms = f(np.linspace(0, 1, len(times)))
    
    # Smooth the amplitude envelope to reduce noise
    window = signal.windows.hann(21)
    rms_smooth = signal.convolve(rms, window/window.sum(), mode='same')
    
    # Calculate a moving baseline using median filter (like we do for pitch)
    # This removes the overall loudness trend and shows variations
    window_size = min(50, len(rms_smooth) // 10)
    if window_size < 3:
        window_size = 3
    
    kernel_size = window_size * 2 + 1
    if kernel_size > len(rms_smooth):
        kernel_size = len(rms_smooth) if len(rms_smooth) % 2 == 1 else len(rms_smooth) - 1
    
    # Get the moving baseline
    rms_baseline = signal.medfilt(rms_smooth, kernel_size=kernel_size)
    
    # Calculate deviation from baseline as percentage
    # This shows how amplitude varies around its local mean
    with np.errstate(divide='ignore', invalid='ignore'):
        amplitude_deviation = ((rms_smooth - rms_baseline) / rms_baseline) * 100
        amplitude_deviation[~np.isfinite(amplitude_deviation)] = 0
    
    return amplitude_deviation, rms_smooth, rms_baseline

def analyze_audio_data(y, sr):
    """Main analysis function."""
    # Extract pitch
    f0, times, voiced_flag = extract_pitch(y, sr)
    
    # Smooth pitch
    f0_smooth = smooth_pitch(f0, window_len=11)
    
    # Detect vibrato
    pitch_deviation, f0_mean, peaks, troughs = detect_vibrato(f0_smooth, times)
    
    # Calculate amplitude deviation from baseline
    amplitude_deviation, amplitude_raw, amplitude_baseline = calculate_amplitude_envelope(y, sr, times)
    
    # Normalize raw amplitude to 0-1 for the correlation graph
    amp_min, amp_max = np.min(amplitude_raw), np.max(amplitude_raw)
    if amp_max > amp_min:
        amplitude_normalized = (amplitude_raw - amp_min) / (amp_max - amp_min)
    else:
        amplitude_normalized = amplitude_raw
    
    # Prepare output data
    result = {
        "times": times.tolist(),
        "pitchDeviation": pitch_deviation.tolist(),
        "amplitudeDeviation": amplitude_deviation.tolist(),  # Deviation from baseline (percentage)
        "amplitude": amplitude_normalized.tolist(),  # Normalized for correlation graph
        "peaks": peaks.tolist(),
        "troughs": troughs.tolist(),
        "oscillations": int(len(peaks)),
        "duration": float(times[-1]),
        "sampleRate": int(sr)
    }
    
    return result

@app.get("/api")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "message": "Vibrato Analyzer API is running",
        "version": "1.0.0"
    }

@app.post("/api/analyze")
async def analyze_audio(file: UploadFile = File(...)):
    """
    Analyze an uploaded audio file for vibrato characteristics.
    
    Args:
        file: Audio file (WAV, MP3, FLAC, etc.)
    
    Returns:
        JSON object with analysis data including pitch deviation, amplitude, peaks, and troughs
    """
    # Validate file type
    allowed_extensions = ['.wav', '.mp3', '.flac', '.m4a', '.ogg', '.aac']
    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    # Create a temporary file to store the upload
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
            # Write uploaded file to temp file
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name
        
        # Load and analyze the audio
        print(f"Loading audio: {file.filename}")
        y, sr = librosa.load(temp_path, sr=None)
        
        print("Analyzing audio...")
        result = analyze_audio_data(y, sr)
        
        # Clean up temp file
        os.unlink(temp_path)
        
        return JSONResponse(content=result)
    
    except Exception as e:
        # Clean up temp file if it exists
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.unlink(temp_path)
        
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/api/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "healthy"}

# Serve frontend static files (for production deployment)
frontend_dist = Path(__file__).parent / "vibrato-viewer" / "dist"
if frontend_dist.exists():
    # Mount static files (JS, CSS, images)
    app.mount("/assets", StaticFiles(directory=frontend_dist / "assets"), name="assets")
    
    # Serve index.html for the root route
    @app.get("/")
    async def serve_root():
        """Serve the frontend app at root."""
        index_file = frontend_dist / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        # If frontend isn't built, show a helpful message
        return {
            "message": "Vibrato Analyzer API",
            "status": "Frontend not built yet",
            "hint": "Run 'cd vibrato-viewer && npm run build' to build the frontend",
            "api_docs": "/docs"
        }
    
    # Catch-all route for SPA (must be last)
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """Serve the frontend app for all non-API routes."""
        # API routes should 404 if not found
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="Not found")
        
        # Serve index.html for all other routes (SPA routing)
        index_file = frontend_dist / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend not built")

if __name__ == "__main__":
    import uvicorn
    print("Starting Vibrato Analyzer API...")
    print("Access the API at: http://localhost:8000")
    print("API docs at: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

