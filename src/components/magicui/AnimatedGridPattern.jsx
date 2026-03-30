/**
 * Animated Grid Pattern — Magic UI
 * https://magicui.design/docs/components/animated-grid-pattern
 *
 * Port exacto de la implementación original de Magic UI,
 * adaptado para funcionar sin Tailwind CSS.
 * Dependencias: framer-motion (ya instalado en el proyecto).
 *
 * Uso típico — como fondo absolute dentro de un contenedor relative:
 *
 *   <div style={{ position: 'relative', overflow: 'hidden' }}>
 *     <AnimatedGridPattern
 *       numSquares={30}
 *       maxOpacity={0.1}
 *       duration={3}
 *       color="#22c55e"
 *       lineColor="rgba(34,197,94,0.15)"
 *     />
 *     <div style={{ position: 'relative', zIndex: 1 }}>
 *       contenido
 *     </div>
 *   </div>
 */
import { motion } from 'framer-motion'
import { useEffect, useId, useRef, useState } from 'react'

export function AnimatedGridPattern({
  width        = 40,
  height       = 40,
  x            = -1,
  y            = -1,
  strokeDasharray = 0,
  numSquares   = 50,
  className,
  maxOpacity   = 0.5,
  duration     = 4,
  repeatDelay  = 0.5,
  // Color de los cuadrados animados (fill de los rects)
  color        = 'currentColor',
  // Color de las líneas del grid (stroke del path)
  lineColor    = 'rgba(0,0,0,0.15)',
  style,
  ...props
}) {
  const id           = useId()
  const containerRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [squares, setSquares]       = useState([])

  function getPos() {
    return [
      Math.floor((Math.random() * dimensions.width)  / width),
      Math.floor((Math.random() * dimensions.height) / height),
    ]
  }

  function generateSquares(count) {
    return Array.from({ length: count }, (_, i) => ({
      id:  i,
      pos: getPos(),
    }))
  }

  const updateSquarePosition = (sqId) => {
    setSquares(current =>
      current.map(sq => sq.id === sqId ? { ...sq, pos: getPos() } : sq)
    )
  }

  useEffect(() => {
    if (dimensions.width && dimensions.height) {
      setSquares(generateSquares(numSquares))
    }
  }, [dimensions, numSquares])

  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width:  entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  return (
    <svg
      ref={containerRef}
      aria-hidden="true"
      className={className}
      style={{
        pointerEvents: 'none',
        position:      'absolute',
        inset:         0,
        width:         '100%',
        height:        '100%',
        color,
        ...style,
      }}
      {...props}
    >
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path
            d={`M.5 ${height}V.5H${width}`}
            fill="none"
            stroke={lineColor}
            strokeDasharray={strokeDasharray}
          />
        </pattern>
      </defs>

      {/* Grid de fondo */}
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />

      {/* Cuadrados animados aleatorios */}
      {squares.map(({ pos: [px, py], id: sqId }, index) => (
        <motion.rect
          key={`${px}-${py}-${index}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: maxOpacity }}
          transition={{
            duration,
            repeat:      1,
            delay:       index * 0.1,
            repeatType: 'reverse',
            ease:        'easeInOut',
            repeatDelay,
          }}
          onAnimationComplete={() => updateSquarePosition(sqId)}
          width={width  - 1}
          height={height - 1}
          x={px * width  + 1}
          y={py * height + 1}
          fill="currentColor"
          strokeWidth="0"
        />
      ))}
    </svg>
  )
}
