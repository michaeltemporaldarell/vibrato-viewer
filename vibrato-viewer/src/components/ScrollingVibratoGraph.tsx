import { useEffect, useRef, useState } from 'react'

interface AnalysisData {
  times: number[]
  pitchDeviation: number[]
  amplitudeDeviation: number[]
  amplitude: number[]
  peaks: number[]
  troughs: number[]
  oscillations: number
}

interface Props {
  analysisData: AnalysisData
  currentTime: number
  duration: number
  isPlaying: boolean
}

const ScrollingVibratoGraph = ({ analysisData, currentTime, duration, isPlaying }: Props) => {
  const pitchCanvasRef = useRef<HTMLCanvasElement>(null)
  const volumeCanvasRef = useRef<HTMLCanvasElement>(null)
  const correlationCanvasRef = useRef<HTMLCanvasElement>(null)
  const [windowSize, setWindowSize] = useState(5) // seconds visible on screen

  // Configuration
  const SCROLL_SPEED = 1 // pixels per frame
  const HEIGHT_PITCH = 200
  const HEIGHT_VOLUME = 150
  const HEIGHT_CORRELATION = 150
  const PADDING = 40

  useEffect(() => {
    const handleResize = () => {
      if (pitchCanvasRef.current) {
        const rect = pitchCanvasRef.current.parentElement?.getBoundingClientRect()
        if (rect) {
          pitchCanvasRef.current.width = rect.width
          pitchCanvasRef.current.height = HEIGHT_PITCH
          
          if (volumeCanvasRef.current) {
            volumeCanvasRef.current.width = rect.width
            volumeCanvasRef.current.height = HEIGHT_VOLUME
          }
          
          if (correlationCanvasRef.current) {
            correlationCanvasRef.current.width = rect.width
            correlationCanvasRef.current.height = HEIGHT_CORRELATION
          }
        }
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Main rendering effect
  useEffect(() => {
    if (!pitchCanvasRef.current || !volumeCanvasRef.current || !correlationCanvasRef.current) return
    if (!analysisData || analysisData.times.length === 0) return

    const pitchCanvas = pitchCanvasRef.current
    const volumeCanvas = volumeCanvasRef.current
    const correlationCanvas = correlationCanvasRef.current
    
    const pitchCtx = pitchCanvas.getContext('2d')
    const volumeCtx = volumeCanvas.getContext('2d')
    const correlationCtx = correlationCanvas.getContext('2d')
    
    if (!pitchCtx || !volumeCtx || !correlationCtx) return

    const width = pitchCanvas.width
    
    // Calculate visible time range (scrolling window)
    const timeEnd = currentTime
    const timeStart = Math.max(0, currentTime - windowSize)
    
    // Find data indices for current window
    const startIdx = analysisData.times.findIndex(t => t >= timeStart)
    const endIdx = analysisData.times.findIndex(t => t >= timeEnd)
    
    if (startIdx === -1 || endIdx === -1) return

    // Clear canvases
    pitchCtx.fillStyle = '#ffffff'
    pitchCtx.fillRect(0, 0, width, HEIGHT_PITCH)
    
    volumeCtx.fillStyle = '#ffffff'
    volumeCtx.fillRect(0, 0, width, HEIGHT_VOLUME)
    
    correlationCtx.fillStyle = '#ffffff'
    correlationCtx.fillRect(0, 0, width, HEIGHT_CORRELATION)

    // Draw grid and labels for pitch graph
    drawGrid(pitchCtx, width, HEIGHT_PITCH, 'Pitch Deviation (cents)', [-200, -100, 0, 100, 200])
    
    // Draw grid and labels for volume graph (showing deviation from baseline)
    drawGrid(volumeCtx, width, HEIGHT_VOLUME, 'Volume Deviation (%)', [-20, -10, 0, 10, 20])
    
    // Draw grid and labels for correlation graph
    drawGrid(correlationCtx, width, HEIGHT_CORRELATION, 'Pitch & Volume Overlay', [-100, -50, 0, 50, 100])

    // Calculate x-axis scaling (time to pixels)
    const timeToX = (time: number) => {
      const normalizedTime = (time - timeStart) / (timeEnd - timeStart)
      return PADDING + normalizedTime * (width - 2 * PADDING)
    }

    // Draw pitch deviation
    drawPitchDeviation(pitchCtx, analysisData, startIdx, endIdx, timeToX, width, HEIGHT_PITCH)
    
    // Draw amplitude
    drawAmplitude(volumeCtx, analysisData, startIdx, endIdx, timeToX, width, HEIGHT_VOLUME)
    
    // Draw correlation overlay
    drawCorrelation(correlationCtx, analysisData, startIdx, endIdx, timeToX, width, HEIGHT_CORRELATION)

    // Draw playhead
    const playheadX = width - PADDING - 10
    drawPlayhead(pitchCtx, playheadX, HEIGHT_PITCH)
    drawPlayhead(volumeCtx, playheadX, HEIGHT_VOLUME)
    drawPlayhead(correlationCtx, playheadX, HEIGHT_CORRELATION)

  }, [analysisData, currentTime, windowSize, isPlaying])

  const drawGrid = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    title: string, 
    yLabels: number[]
  ) => {
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.font = '12px -apple-system, system-ui, sans-serif'
    ctx.fillStyle = '#9ca3af'

    // Draw title
    ctx.fillStyle = '#111827'
    ctx.font = '600 14px -apple-system, system-ui, sans-serif'
    ctx.fillText(title, PADDING, 20)
    ctx.fillStyle = '#9ca3af'
    ctx.font = '12px -apple-system, system-ui, sans-serif'

    // Horizontal grid lines
    yLabels.forEach((label, i) => {
      const y = PADDING + ((height - 2 * PADDING) / (yLabels.length - 1)) * i
      
      ctx.beginPath()
      ctx.moveTo(PADDING, y)
      ctx.lineTo(width - PADDING, y)
      ctx.stroke()
      
      // Y-axis labels
      ctx.textAlign = 'right'
      ctx.fillText(label.toString(), PADDING - 5, y + 4)
    })

    // Center line (0 or 0.5)
    const centerIdx = Math.floor(yLabels.length / 2)
    const centerY = PADDING + ((height - 2 * PADDING) / (yLabels.length - 1)) * centerIdx
    ctx.strokeStyle = '#d1d5db'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(PADDING, centerY)
    ctx.lineTo(width - PADDING, centerY)
    ctx.stroke()
  }

  const drawPitchDeviation = (
    ctx: CanvasRenderingContext2D,
    data: AnalysisData,
    startIdx: number,
    endIdx: number,
    timeToX: (t: number) => number,
    width: number,
    height: number
  ) => {
    const centerY = height / 2
    const scale = (height - 2 * PADDING) / 400 // ±200 cents range

    // Draw filled areas
    ctx.globalAlpha = 0.15
    
    // Above zero
    ctx.fillStyle = '#3b82f6'
    ctx.beginPath()
    ctx.moveTo(timeToX(data.times[startIdx]), centerY)
    for (let i = startIdx; i <= endIdx && i < data.times.length; i++) {
      const x = timeToX(data.times[i])
      const y = centerY - data.pitchDeviation[i] * scale
      const clampedY = Math.max(PADDING, Math.min(height - PADDING, y))
      ctx.lineTo(x, clampedY)
    }
    ctx.lineTo(timeToX(data.times[Math.min(endIdx, data.times.length - 1)]), centerY)
    ctx.closePath()
    ctx.fill()

    // Below zero
    ctx.fillStyle = '#3b82f6'
    ctx.beginPath()
    ctx.moveTo(timeToX(data.times[startIdx]), centerY)
    for (let i = startIdx; i <= endIdx && i < data.times.length; i++) {
      const x = timeToX(data.times[i])
      const y = centerY - data.pitchDeviation[i] * scale
      const clampedY = Math.max(PADDING, Math.min(height - PADDING, y))
      if (data.pitchDeviation[i] < 0) {
        ctx.lineTo(x, clampedY)
      }
    }
    ctx.lineTo(timeToX(data.times[Math.min(endIdx, data.times.length - 1)]), centerY)
    ctx.closePath()
    ctx.fill()

    ctx.globalAlpha = 1

    // Draw main line
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    let started = false
    for (let i = startIdx; i <= endIdx && i < data.times.length; i++) {
      const x = timeToX(data.times[i])
      const y = centerY - data.pitchDeviation[i] * scale
      const clampedY = Math.max(PADDING, Math.min(height - PADDING, y))
      
      if (!started) {
        ctx.moveTo(x, clampedY)
        started = true
      } else {
        ctx.lineTo(x, clampedY)
      }
    }
    ctx.stroke()

    // Draw peaks and troughs
    data.peaks.forEach(idx => {
      if (idx >= startIdx && idx <= endIdx) {
        const x = timeToX(data.times[idx])
        const y = centerY - data.pitchDeviation[idx] * scale
        const clampedY = Math.max(PADDING, Math.min(height - PADDING, y))
        drawMarker(ctx, x, clampedY, '#10b981', 6)
      }
    })

    data.troughs.forEach(idx => {
      if (idx >= startIdx && idx <= endIdx) {
        const x = timeToX(data.times[idx])
        const y = centerY - data.pitchDeviation[idx] * scale
        const clampedY = Math.max(PADDING, Math.min(height - PADDING, y))
        drawMarker(ctx, x, clampedY, '#f59e0b', 6)
      }
    })
  }

  const drawAmplitude = (
    ctx: CanvasRenderingContext2D,
    data: AnalysisData,
    startIdx: number,
    endIdx: number,
    timeToX: (t: number) => number,
    width: number,
    height: number
  ) => {
    const centerY = height / 2
    const scale = (height - 2 * PADDING) / 40 // ±20% range

    // Draw filled areas
    ctx.globalAlpha = 0.15
    
    // Above zero (louder than baseline)
    ctx.fillStyle = '#10b981'
    ctx.beginPath()
    ctx.moveTo(timeToX(data.times[startIdx]), centerY)
    for (let i = startIdx; i <= endIdx && i < data.times.length; i++) {
      const x = timeToX(data.times[i])
      const y = centerY - data.amplitudeDeviation[i] * scale
      const clampedY = Math.max(PADDING, Math.min(height - PADDING, y))
      ctx.lineTo(x, clampedY)
    }
    ctx.lineTo(timeToX(data.times[Math.min(endIdx, data.times.length - 1)]), centerY)
    ctx.closePath()
    ctx.fill()

    // Below zero (quieter than baseline)
    ctx.fillStyle = '#f59e0b'
    ctx.beginPath()
    ctx.moveTo(timeToX(data.times[startIdx]), centerY)
    for (let i = startIdx; i <= endIdx && i < data.times.length; i++) {
      const x = timeToX(data.times[i])
      const y = centerY - data.amplitudeDeviation[i] * scale
      const clampedY = Math.max(PADDING, Math.min(height - PADDING, y))
      if (data.amplitudeDeviation[i] < 0) {
        ctx.lineTo(x, clampedY)
      }
    }
    ctx.lineTo(timeToX(data.times[Math.min(endIdx, data.times.length - 1)]), centerY)
    ctx.closePath()
    ctx.fill()

    ctx.globalAlpha = 1

    // Draw main line
    ctx.strokeStyle = '#10b981'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    let started = false
    for (let i = startIdx; i <= endIdx && i < data.times.length; i++) {
      const x = timeToX(data.times[i])
      const y = centerY - data.amplitudeDeviation[i] * scale
      const clampedY = Math.max(PADDING, Math.min(height - PADDING, y))
      
      if (!started) {
        ctx.moveTo(x, clampedY)
        started = true
      } else {
        ctx.lineTo(x, clampedY)
      }
    }
    ctx.stroke()
  }

  const drawCorrelation = (
    ctx: CanvasRenderingContext2D,
    data: AnalysisData,
    startIdx: number,
    endIdx: number,
    timeToX: (t: number) => number,
    width: number,
    height: number
  ) => {
    const centerY = height / 2
    // Use a scale that fits both pitch (cents) and amplitude (%) reasonably
    // Pitch is typically ±50 cents for vibrato, amplitude ±10%
    // Scale to ±100 units for display
    const pitchScale = (height - 2 * PADDING) / 200  // ±100 cents range
    const ampScale = (height - 2 * PADDING) / 200    // ±100% range (though typically ±10%)

    // Draw pitch deviation (blue)
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2.5
    ctx.globalAlpha = 0.7
    ctx.beginPath()
    let started = false
    for (let i = startIdx; i <= endIdx && i < data.times.length; i++) {
      const x = timeToX(data.times[i])
      const y = centerY - data.pitchDeviation[i] * pitchScale
      const clampedY = Math.max(PADDING, Math.min(height - PADDING, y))
      
      if (!started) {
        ctx.moveTo(x, clampedY)
        started = true
      } else {
        ctx.lineTo(x, clampedY)
      }
    }
    ctx.stroke()

    // Draw amplitude deviation (green)
    // Scale amplitude deviation to match pitch scale visually
    // Multiply by ~5 to make ±10% amplitude deviation visually comparable to ±50 cents pitch
    ctx.strokeStyle = '#10b981'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    started = false
    for (let i = startIdx; i <= endIdx && i < data.times.length; i++) {
      const x = timeToX(data.times[i])
      // Amplify amplitude deviation for visibility (5x multiplier)
      const y = centerY - (data.amplitudeDeviation[i] * 5) * ampScale
      const clampedY = Math.max(PADDING, Math.min(height - PADDING, y))
      
      if (!started) {
        ctx.moveTo(x, clampedY)
        started = true
      } else {
        ctx.lineTo(x, clampedY)
      }
    }
    ctx.stroke()
    ctx.globalAlpha = 1

    // Calculate and display correlation between pitch and amplitude deviations
    if (endIdx > startIdx) {
      const pitchSlice = data.pitchDeviation.slice(startIdx, endIdx + 1)
      const ampSlice = data.amplitudeDeviation.slice(startIdx, endIdx + 1)
      const corr = calculateCorrelation(pitchSlice, ampSlice)
      
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(10, 10, 180, 30)
      ctx.fillStyle = '#111827'
      ctx.font = '600 14px -apple-system, system-ui, sans-serif'
      ctx.fillText(`Correlation: ${corr.toFixed(3)}`, 20, 30)
    }
  }

  const drawMarker = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    color: string, 
    size: number
  ) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.strokeStyle = color === '#10b981' ? '#047857' : '#d97706'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

  const drawPlayhead = (ctx: CanvasRenderingContext2D, x: number, height: number) => {
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x, PADDING)
    ctx.lineTo(x, height - PADDING)
    ctx.stroke()

    // Playhead indicator
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.moveTo(x, PADDING)
    ctx.lineTo(x - 6, PADDING - 10)
    ctx.lineTo(x + 6, PADDING - 10)
    ctx.closePath()
    ctx.fill()
  }

  const calculateCorrelation = (x: number[], y: number[]): number => {
    if (x.length !== y.length || x.length === 0) return 0

    const n = x.length
    const meanX = x.reduce((a, b) => a + b, 0) / n
    const meanY = y.reduce((a, b) => a + b, 0) / n

    let numerator = 0
    let denomX = 0
    let denomY = 0

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX
      const dy = y[i] - meanY
      numerator += dx * dy
      denomX += dx * dx
      denomY += dy * dy
    }

    if (denomX === 0 || denomY === 0) return 0
    return numerator / Math.sqrt(denomX * denomY)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Window Size Control */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
        <label className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Scroll Window:</span>
          <input
            type="range"
            min="2"
            max="10"
            step="0.5"
            value={windowSize}
            onChange={(e) => setWindowSize(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm font-semibold text-blue-500 w-16">{windowSize.toFixed(1)}s</span>
        </label>
        <p className="text-xs text-gray-500 mt-2">
          💡 Smaller window = more zoomed in, larger window = see more context
        </p>
      </div>

      {/* Pitch Deviation Graph */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
        <canvas ref={pitchCanvasRef} className="w-full rounded-lg" />
      </div>

      {/* Volume Graph */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
        <canvas ref={volumeCanvasRef} className="w-full rounded-lg" />
      </div>

      {/* Correlation Graph */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
        <canvas ref={correlationCanvasRef} className="w-full rounded-lg" />
      </div>
    </div>
  )
}

export default ScrollingVibratoGraph

