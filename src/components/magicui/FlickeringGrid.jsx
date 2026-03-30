/**
 * Flickering Grid — Magic UI
 * https://magicui.design/docs/components/flickering-grid
 *
 * Port exacto de la implementación original de Magic UI,
 * adaptado para funcionar sin Tailwind CSS.
 * Dependencias: ninguna adicional (solo React).
 */
import { useCallback, useEffect, useMemo, useRef } from 'react'

export function FlickeringGrid({
  squareSize    = 4,
  gridGap       = 6,
  flickerChance = 0.3,
  color         = 'rgb(0, 0, 0)',
  width,
  height,
  className,
  maxOpacity    = 0.3,
  style,
}) {
  const canvasRef    = useRef(null)
  const containerRef = useRef(null)

  // Convierte cualquier color CSS a {r, g, b, a} usando un canvas 1×1
  const memoizedColor = useMemo(() => {
    const toRgba = (c) => {
      const tmp = document.createElement('canvas')
      tmp.width = tmp.height = 1
      const ctx = tmp.getContext('2d')
      ctx.fillStyle = c
      ctx.fillRect(0, 0, 1, 1)
      const [r, g, b, a] = Array.from(ctx.getImageData(0, 0, 1, 1).data)
      return { r, g, b, a: a / 255 }
    }
    return toRgba(color)
  }, [color])

  const setupCanvas = useCallback((canvas, w, h) => {
    const dpr = window.devicePixelRatio || 1
    canvas.width  = w * dpr
    canvas.height = h * dpr
    canvas.style.width  = `${w}px`
    canvas.style.height = `${h}px`
    const cols = Math.floor(w / (squareSize + gridGap))
    const rows = Math.floor(h / (squareSize + gridGap))
    const squares = new Float32Array(cols * rows)
    for (let i = 0; i < squares.length; i++) {
      squares[i] = Math.random() * maxOpacity
    }
    return { cols, rows, squares, dpr }
  }, [squareSize, gridGap, maxOpacity])

  const updateCanvas = useCallback((canvas, ctx, squares, cols, rows, dpr, color) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const idx = i * rows + j
        const x   = i * (squareSize + gridGap) * dpr
        const y   = j * (squareSize + gridGap) * dpr
        const sz  = squareSize * dpr

        if (Math.random() < flickerChance) {
          squares[idx] = Math.random() * maxOpacity
        }

        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${squares[idx]})`
        ctx.fillRect(x, y, sz, sz)
      }
    }
  }, [squareSize, gridGap, flickerChance, maxOpacity])

  useEffect(() => {
    const canvas    = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rafId
    let currentCols    = 0, currentRows    = 0
    let currentSquares = new Float32Array(0)
    let currentDpr     = 1

    const animate = () => {
      updateCanvas(canvas, ctx, currentSquares, currentCols, currentRows, currentDpr, memoizedColor)
      rafId = requestAnimationFrame(animate)
    }

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect
        cancelAnimationFrame(rafId)
        const { cols, rows, squares, dpr } = setupCanvas(canvas, w, h)
        currentCols    = cols
        currentRows    = rows
        currentSquares = squares
        currentDpr     = dpr
        rafId = requestAnimationFrame(animate)
      }
    })

    ro.observe(container)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
    }
  }, [setupCanvas, updateCanvas, memoizedColor])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: width ?? '100%', height: height ?? '100%', ...style }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', pointerEvents: 'none' }}
      />
    </div>
  )
}
