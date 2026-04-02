/**
 * Ripple — Magic UI
 * Solo ondas, sin punto central. Visibles pero suaves.
 */
export function Ripple({
  mainCircleSize    = 52,
  mainCircleOpacity = 0.35,
  numCircles        = 5,
  color             = 'currentColor',
  duration          = 3,
  style,
}) {
  return (
    <div
      style={{
        position:       'absolute',
        inset:          0,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        overflow:       'hidden',
        borderRadius:   'inherit',
        pointerEvents:  'none',
        ...style,
      }}
    >
      <style>{`
        @keyframes rippleOut {
          0%   { transform: scale(0.8);  opacity: var(--op); }
          100% { transform: scale(1.2);  opacity: 0; }
        }
      `}</style>

      {Array.from({ length: numCircles }, (_, i) => {
        const size    = mainCircleSize + i * 26
        const opacity = Math.max(0.05, mainCircleOpacity - i * (mainCircleOpacity / numCircles))
        const delay   = `${i * (duration / numCircles)}s`

        return (
          <div
            key={i}
            style={{
              position:     'absolute',
              width:        size,
              height:       size,
              borderRadius: '50%',
              border:       `1.5px solid ${color}`,
              background:   'transparent',
              opacity,
              '--op':       opacity,
              animation:    `rippleOut ${duration}s ease-out ${delay} infinite`,
            }}
          />
        )
      })}
    </div>
  )
}
