import { useId } from 'react'

/** Shelving rack loaded with cardboard boxes, standing at x (left edge) on the floor line. */
function rack(x: number, width: number, key: string) {
  const levels = [470, 380, 290]
  return (
    <g key={key}>
      {[x, x + width].map((px) => (
        <rect key={px} x={px - 4} y={250} width={8} height={240} fill="#46536b" />
      ))}
      {levels.map((y, i) => (
        <g key={y}>
          <rect x={x - 4} y={y} width={width + 8} height={7} fill="#5a6884" />
          {Array.from({ length: Math.floor(width / 46) }, (_, j) => {
            const w = 38 + ((i + j) % 3) * 4
            const h = 30 + ((i * 3 + j) % 4) * 8
            return (
              <g key={j}>
                <rect x={x + 6 + j * 46} y={y - h} width={w} height={h} fill="#b08a5a" stroke="#7d5f3a" strokeWidth={1.5} />
                <rect x={x + 6 + j * 46} y={y - h} width={w} height={6} fill="#c49c69" />
              </g>
            )
          })}
          {/* X-bracing between levels. */}
          <path d={`M${x},${y} L${x + width},${y - 90} M${x + width},${y} L${x},${y - 90}`} stroke="#3c475c" strokeWidth={2} opacity={0.6} />
        </g>
      ))}
    </g>
  )
}

/** The factory floor behind the Body Selection screen - steel columns, roof trusses, stocked
 * shelving and a conveyor line the body shell sits on, like the reference's assembly hall.
 * Drawn wide (1600 x 700) and cropped with "slice" so it fills any screen shape. Muted and
 * darkened on purpose: it's a backdrop, the car on top is the subject. */
export function FactoryBackdrop({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, '')
  return (
    <svg className={className} viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b465e" />
          <stop offset="1" stopColor="#6d7891" />
        </linearGradient>
        <linearGradient id={`${uid}-window`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c7d6ea" />
          <stop offset="1" stopColor="#8fa4c2" />
        </linearGradient>
        <linearGradient id={`${uid}-shade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1430" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#0b1430" stopOpacity="0.25" />
          <stop offset="1" stopColor="#0b1430" stopOpacity="0.8" />
        </linearGradient>
        <radialGradient id={`${uid}-vignette`} cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.55" stopColor="#0b1430" stopOpacity="0" />
          <stop offset="1" stopColor="#0b1430" stopOpacity="0.85" />
        </radialGradient>
      </defs>

      <rect width={1600} height={700} fill={`url(#${uid}-wall)`} />
      {/* Clerestory windows. */}
      {Array.from({ length: 6 }, (_, i) => (
        <g key={i}>
          <rect x={60 + i * 260} y={140} width={200} height={170} fill={`url(#${uid}-window)`} stroke="#2d374b" strokeWidth={6} />
          <path d={`M${160 + i * 260},140 v170 M${60 + i * 260},225 h200`} stroke="#2d374b" strokeWidth={4} />
        </g>
      ))}
      {/* Roll-up loading doors at the back. */}
      {[540, 880].map((x) => (
        <g key={x}>
          <rect x={x} y={330} width={180} height={160} fill="#9aa4b6" stroke="#3a4458" strokeWidth={5} />
          {Array.from({ length: 10 }, (_, i) => (
            <line key={i} x1={x} x2={x + 180} y1={340 + i * 15} y2={340 + i * 15} stroke="#7d879a" strokeWidth={2} />
          ))}
        </g>
      ))}
      {/* Roof trusses and ceiling. */}
      <rect width={1600} height={110} fill="#2b3346" />
      <path
        d={Array.from({ length: 17 }, (_, i) => `M${i * 100},110 L${i * 100 + 50},40 L${i * 100 + 100},110`).join(' ')}
        stroke="#56627a"
        strokeWidth={6}
        fill="none"
      />
      <rect y={104} width={1600} height={14} fill="#56627a" />
      {/* Hanging lamps. */}
      {[300, 800, 1300].map((x) => (
        <g key={x}>
          <line x1={x} y1={118} x2={x} y2={170} stroke="#1c2230" strokeWidth={3} />
          <path d={`M${x - 34},${200} L${x + 34},${200} L${x + 16},${170} L${x - 16},${170} Z`} fill="#3c4558" />
          <ellipse cx={x} cy={202} rx={26} ry={6} fill="#fff1c4" opacity={0.9} />
        </g>
      ))}
      {/* Steel columns. */}
      {[110, 470, 1130, 1490].map((x) => (
        <g key={x}>
          <rect x={x - 22} y={110} width={44} height={400} fill="#4f5b73" />
          <rect x={x - 22} y={110} width={10} height={400} fill="#66738d" />
        </g>
      ))}
      {rack(150, 290, 'rack-left')}
      {rack(1160, 290, 'rack-right')}

      {/* Floor and the conveyor line. */}
      <rect y={490} width={1600} height={210} fill="#2a3245" />
      <rect y={540} width={1600} height={70} fill="#39435a" />
      <rect y={536} width={1600} height={8} fill="#e2b33c" />
      <rect y={608} width={1600} height={8} fill="#e2b33c" />
      {Array.from({ length: 40 }, (_, i) => (
        <line key={i} x1={i * 42} x2={i * 42 + 20} y1={575} y2={575} stroke="#4b566f" strokeWidth={3} />
      ))}

      <rect width={1600} height={700} fill={`url(#${uid}-shade)`} />
      <rect width={1600} height={700} fill={`url(#${uid}-vignette)`} />
    </svg>
  )
}
