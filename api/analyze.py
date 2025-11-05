"""
Vercel Serverless Function for audio analysis
"""
from http.server import BaseHTTPRequestHandler
import json
import io
import tempfile
import os
import numpy as np
import librosa
from scipy import signal
from scipy.interpolate import interp1d

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
    
    # Calculate a moving baseline using median filter
    window_size = min(50, len(rms_smooth) // 10)
    if window_size < 3:
        window_size = 3
    
    kernel_size = window_size * 2 + 1
    if kernel_size > len(rms_smooth):
        kernel_size = len(rms_smooth) if len(rms_smooth) % 2 == 1 else len(rms_smooth) - 1
    
    rms_baseline = signal.medfilt(rms_smooth, kernel_size=kernel_size)
    
    # Calculate deviation from baseline as percentage
    with np.errstate(divide='ignore', invalid='ignore'):
        amplitude_deviation = ((rms_smooth - rms_baseline) / rms_baseline) * 100
        amplitude_deviation[~np.isfinite(amplitude_deviation)] = 0
    
    return amplitude_deviation, rms_smooth, rms_baseline

def analyze_audio_data(audio_bytes):
    """Main analysis function."""
    # Write to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name
    
    try:
        # Load audio
        y, sr = librosa.load(tmp_path, sr=None)
        
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
            "amplitudeDeviation": amplitude_deviation.tolist(),
            "amplitude": amplitude_normalized.tolist(),
            "peaks": peaks.tolist(),
            "troughs": troughs.tolist(),
            "oscillations": int(len(peaks)),
            "duration": float(times[-1]),
            "sampleRate": int(sr)
        }
        
        return result
    finally:
        # Clean up temp file
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/analyze':
            try:
                # Read the content length
                content_length = int(self.headers['Content-Length'])
                
                # Read the body
                body = self.rfile.read(content_length)
                
                # Parse multipart form data
                boundary = self.headers['Content-Type'].split('boundary=')[1]
                parts = body.split(f'--{boundary}'.encode())
                
                audio_data = None
                for part in parts:
                    if b'Content-Disposition' in part and b'filename=' in part:
                        # Extract the file data (after the headers)
                        file_start = part.find(b'\r\n\r\n') + 4
                        file_end = len(part) - 2  # Remove trailing \r\n
                        audio_data = part[file_start:file_end]
                        break
                
                if audio_data is None:
                    self.send_response(400)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "No audio file found"}).encode())
                    return
                
                # Analyze the audio
                result = analyze_audio_data(audio_data)
                
                # Send response
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode())
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        if self.path == '/api/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "healthy"}).encode())
        else:
            self.send_response(404)
            self.end_headers()

