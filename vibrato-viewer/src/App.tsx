import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, SkipBack, Upload } from 'lucide-react'
import ScrollingVibratoGraph from './components/ScrollingVibratoGraph'
import './App.css'

interface AnalysisData {
  times: number[]
  pitchDeviation: number[]
  amplitudeDeviation: number[]  // Deviation from baseline in percentage
  amplitude: number[]  // Normalized 0-1 for correlation
  peaks: number[]
  troughs: number[]
  oscillations: number
}

function App() {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const animationFrameRef = useRef<number>()
  const progressBarRef = useRef<HTMLDivElement>(null)

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Reset state
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
      
      setAudioFile(file)
      const url = URL.createObjectURL(file)
      setAudioUrl(url)
      
      // Trigger analysis
      await analyzeAudio(file)
    }
  }


  // Analyze audio using Python backend
  const analyzeAudio = async (file: File) => {
    setIsAnalyzing(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      // Use environment variable for API URL, fallback to relative path for production
      const apiUrl = (import.meta.env?.VITE_API_URL as string | undefined) || ''
      const endpoint = apiUrl ? `${apiUrl}/analyze` : '/api/analyze'
      
      console.log('Uploading and analyzing audio...', endpoint)
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Analysis failed')
      }
      
      const data = await response.json()
      setAnalysisData(data)
      console.log('✅ Analysis complete!', data)
    } catch (error) {
      console.error('Analysis failed:', error)
      alert(`Failed to analyze audio: ${error}. Make sure the backend is running (uvicorn backend:app --reload)`)
      
      // Fallback to mock data for demonstration
      console.log('Falling back to mock data...')
      const mockData = generateMockData()
      setAnalysisData(mockData)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Generate mock data for demonstration
  const generateMockData = (): AnalysisData => {
    const sampleRate = 44100
    const hopLength = 512
    const numFrames = 2000
    
    const times: number[] = []
    const pitchDeviation: number[] = []
    const amplitudeDeviation: number[] = []
    const amplitude: number[] = []
    const peaks: number[] = []
    const troughs: number[] = []
    
    for (let i = 0; i < numFrames; i++) {
      const time = (i * hopLength) / sampleRate
      times.push(time)
      
      // Simulated vibrato (4-6 Hz oscillation with varying amplitude)
      const vibratoRate = 5.5 + Math.sin(time * 0.5) * 0.5
      const vibratoWidth = 30 + Math.sin(time * 0.3) * 20
      const pitch = vibratoWidth * Math.sin(2 * Math.PI * vibratoRate * time)
      pitchDeviation.push(pitch)
      
      // Simulated amplitude deviation (percentage from baseline, correlated with pitch)
      const ampDeviation = (pitch / 30) * 5 + Math.sin(2 * Math.PI * vibratoRate * time + 0.3) * 3
      amplitudeDeviation.push(ampDeviation)
      
      // Simulated normalized amplitude for correlation graph
      const baseAmp = 0.5 + Math.sin(time * 0.7) * 0.3
      const pitchCorrelation = (pitch / 100) * 0.2
      amplitude.push(Math.max(0, baseAmp + pitchCorrelation))
      
      // Detect peaks and troughs
      if (i > 0 && i < numFrames - 1) {
        if (pitchDeviation[i] > pitchDeviation[i-1] && pitchDeviation[i] > pitchDeviation[i+1]) {
          if (Math.abs(pitchDeviation[i]) > 10) {
            peaks.push(i)
          }
        }
        if (pitchDeviation[i] < pitchDeviation[i-1] && pitchDeviation[i] < pitchDeviation[i+1]) {
          if (Math.abs(pitchDeviation[i]) > 10) {
            troughs.push(i)
          }
        }
      }
    }
    
    return {
      times,
      pitchDeviation,
      amplitudeDeviation,
      amplitude,
      peaks,
      troughs,
      oscillations: peaks.length
    }
  }

  // Audio playback controls
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const restart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      setCurrentTime(0)
    }
  }

  const seekTo = useCallback((time: number) => {
    if (audioRef.current && duration > 0) {
      const clampedTime = Math.max(0, Math.min(time, duration))
      audioRef.current.currentTime = clampedTime
      setCurrentTime(clampedTime)
    }
  }, [duration])

  const handleProgressDragStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    console.log('Drag start')
    setIsDragging(true)
    if (progressBarRef.current && duration > 0) {
      const rect = progressBarRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = x / rect.width
      const time = percentage * duration
      seekTo(time)
    }
  }, [duration, seekTo])

  const handleProgressDrag = useCallback((e: MouseEvent) => {
    if (progressBarRef.current && duration > 0) {
      e.preventDefault()
      const rect = progressBarRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = Math.max(0, Math.min(1, x / rect.width))
      const time = percentage * duration
      seekTo(time)
    }
  }, [duration, seekTo])

  const handleProgressDragEnd = useCallback(() => {
    console.log('Drag end')
    setIsDragging(false)
  }, [])

  // Handle mouse events for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleProgressDrag)
      window.addEventListener('mouseup', handleProgressDragEnd)
      return () => {
        window.removeEventListener('mousemove', handleProgressDrag)
        window.removeEventListener('mouseup', handleProgressDragEnd)
      }
    }
  }, [isDragging, handleProgressDrag, handleProgressDragEnd])

  // Update current time during playback with RAF for smooth updates
  useEffect(() => {
    const updateTime = () => {
      if (audioRef.current && isPlaying && !isDragging) {
        setCurrentTime(audioRef.current.currentTime)
        animationFrameRef.current = requestAnimationFrame(updateTime)
      }
    }

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateTime)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, isDragging])

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      console.log('Audio metadata loaded, duration:', audio.duration)
      setDuration(audio.duration)
      setCurrentTime(0)
    }

    const handleCanPlay = () => {
      // Fallback in case loadedmetadata doesn't fire
      if (duration === 0 && audio.duration && isFinite(audio.duration)) {
        console.log('Audio can play, setting duration:', audio.duration)
        setDuration(audio.duration)
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(audio.duration || 0)
    }

    const handleTimeUpdate = () => {
      // Only update from timeupdate when not playing (to catch manual seeks)
      if (!isPlaying && !isDragging) {
        setCurrentTime(audio.currentTime)
      }
    }

    const handleError = (e: Event) => {
      console.error('Audio error:', e)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('error', handleError)

    // Force load if audio already has duration
    if (audio.duration && isFinite(audio.duration)) {
      setDuration(audio.duration)
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('error', handleError)
    }
  }, [audioUrl, isPlaying, isDragging, duration])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-semibold mb-3 text-gray-900 tracking-tight">
            Vibrato Viewer
          </h1>
          <p className="text-gray-500 text-lg font-medium">Real-time scrolling vibrato analysis</p>
        </div>

        {/* File Upload */}
        {!audioFile && (
          <div className="max-w-2xl mx-auto mb-8">
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-blue-300 border-dashed rounded-2xl cursor-pointer bg-white hover:bg-blue-50 transition-all shadow-sm hover:shadow-md">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-16 h-16 mb-4 text-blue-500" />
                <p className="mb-2 text-xl font-semibold text-gray-900">
                  Click to upload audio file
                </p>
                <p className="text-sm text-gray-500">WAV, MP3, FLAC or other audio formats</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="audio/*"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        )}

        {/* Analysis Loading */}
        {isAnalyzing && (
          <div className="text-center mb-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-700 text-lg font-medium">Analyzing audio...</p>
          </div>
        )}

        {/* Main Content */}
        {audioFile && analysisData && !isAnalyzing && (
          <>
            {/* Audio Controls */}
            <div className="max-w-4xl mx-auto mb-8 bg-white rounded-2xl p-6 border border-gray-200 shadow-md">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={restart}
                  className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                  aria-label="Restart"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                <button
                  onClick={togglePlayPause}
                  className="p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors shadow-sm"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-1" />
                  )}
                </button>
                <div className="flex-1">
                  <div className="text-sm text-gray-600 mb-1 font-medium">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                  <div 
                    ref={progressBarRef}
                    className={`relative w-full py-2 -my-2 select-none ${
                      isDragging ? 'cursor-grabbing' : 'cursor-pointer'
                    }`}
                    onMouseDown={handleProgressDragStart}
                  >
                    <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-visible group">
                      <div
                        className="absolute top-0 left-0 h-full bg-blue-500 rounded-full pointer-events-none transition-all"
                        style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                      />
                      {/* Draggable playhead dot */}
                      <div
                        className={`absolute top-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-md transition-all pointer-events-none ${
                          isDragging ? 'scale-150' : 'scale-100 group-hover:scale-125'
                        }`}
                        style={{ 
                          left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                          transform: 'translate(-50%, -50%)',
                          boxShadow: isDragging ? '0 4px 12px rgba(59, 130, 246, 0.5)' : undefined
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <div className="text-sm text-gray-500 font-medium">Duration</div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {formatTime(duration)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 font-medium">Oscillations</div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {analysisData.oscillations}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 font-medium">Vibrato Rate</div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {duration > 0 ? (analysisData.oscillations / duration).toFixed(2) : '0.00'} Hz
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 font-medium">File</div>
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {audioFile.name}
                  </div>
                </div>
              </div>
            </div>

            {/* Scrolling Visualization */}
            <ScrollingVibratoGraph
              analysisData={analysisData}
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
            />

            {/* Hidden audio element */}
            <audio 
              ref={audioRef} 
              src={audioUrl} 
              preload="metadata"
              crossOrigin="anonymous"
            />
          </>
        )}
      </div>
    </div>
  )
}

export default App

