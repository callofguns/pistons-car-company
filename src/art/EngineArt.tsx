import type { EngineBuild } from '../core/engineBuilder'

/** A side-on drawing of an engine that changes with the build: one cylinder cap per cylinder, a
 * lighter block for aluminum, intake and exhaust pipes, and a turbo when it has forced induction.
 * With no build it shows an empty outline. */
export function EngineArt({ build, className }: { build: EngineBuild | null; className?: string }) {
  if (!build) {
    return (
      <svg className={className} viewBox="0 0 300 200" aria-hidden="true">
        <rect x="40" y="60" width="220" height="100" rx="10" fill="none" stroke="rgba(160,190,255,0.35)" strokeWidth="2" strokeDasharray="8 6" />
      </svg>
    )
  }
  const electric = build.fuel === 'electric'
  const cylinders = Math.max(1, build.cylinders)
  const width = electric ? 150 : 70 + cylinders * 28
  const x0 = 60
  const total = x0 * 2 + width
  const light = build.parts['engine-material'] === 'aluminum'
  const headLight = build.parts['head-material'] === 'aluminum'
  const block = light ? ['#e8ecf4', '#9aa3b8'] : ['#9ea4b0', '#585d6b']
  const head = headLight ? ['#f0f3f9', '#aab3c8'] : ['#b3b8c3', '#6a7080']
  const turbo = (build.parts['forced-induction'] ?? 'none') !== 'none'
  const injection = build.parts['fuel-system'] !== 'carburetor'
  const tubular = build.parts.manifold === 'tubular'
  const id = `eng-${cylinders}-${light ? 'a' : 'c'}-${headLight ? 'a' : 'c'}`

  if (electric) {
    return (
      <svg className={className} viewBox={`0 0 ${total} 200`} aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-m`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c9d4ea" />
            <stop offset="1" stopColor="#5b6a8c" />
          </linearGradient>
        </defs>
        <rect x={x0} y="70" width={width} height="80" rx="40" fill={`url(#${id}-m)`} stroke="#2a3350" strokeWidth="3" />
        <rect x={x0 + 20} y="55" width={width - 40} height="20" rx="6" fill="#3f9a55" stroke="#1e4a2a" strokeWidth="2" />
        <circle cx={x0 + width / 2} cy="110" r="22" fill="#2a3350" stroke="#9fb4ee" strokeWidth="3" />
      </svg>
    )
  }

  return (
    <svg className={className} viewBox={`0 0 ${total} 200`} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={block[0]} />
          <stop offset="1" stopColor={block[1]} />
        </linearGradient>
        <linearGradient id={`${id}-h`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={head[0]} />
          <stop offset="1" stopColor={head[1]} />
        </linearGradient>
      </defs>

      {/* exhaust manifold on the left */}
      <g stroke="#3a2a22" strokeWidth="2" fill="#8a6a55">
        {Array.from({ length: cylinders }, (_, i) => (
          <path
            key={i}
            d={`M${x0 + 24 + i * 28},70 q-6,-30 ${tubular ? -28 - i * 3 : -24},-34`}
            fill="none"
            stroke={tubular ? '#b9bfcc' : '#8a6a55'}
            strokeWidth={tubular ? 4 : 7}
            strokeLinecap="round"
          />
        ))}
      </g>

      {/* oil pan, block and head */}
      <path d={`M${x0 + 10},148 h${width - 20} l-10,26 h${-(width - 40)} Z`} fill="#4a4f5d" stroke="#232734" strokeWidth="2" />
      <rect x={x0} y="92" width={width} height="58" rx="6" fill={`url(#${id}-b)`} stroke="#232734" strokeWidth="2.5" />
      <rect x={x0 - 4} y="62" width={width + 8} height="32" rx="6" fill={`url(#${id}-h)`} stroke="#232734" strokeWidth="2.5" />
      {/* cylinder caps */}
      {Array.from({ length: cylinders }, (_, i) => (
        <g key={i}>
          <circle cx={x0 + 24 + i * 28} cy="78" r="9" fill="#2c303c" stroke="#10131b" strokeWidth="1.5" />
          <circle cx={x0 + 24 + i * 28} cy="78" r="3.5" fill="#8d95a8" />
          <circle cx={x0 + 24 + i * 28} cy="118" r="5" fill="#40455a" opacity="0.7" />
        </g>
      ))}

      {/* intake on top */}
      <rect x={x0 + 14} y="42" width={width - 28} height="20" rx="5" fill="#c3c8d3" stroke="#232734" strokeWidth="2" />
      {injection
        ? Array.from({ length: cylinders }, (_, i) => <rect key={i} x={x0 + 20 + i * 28} y="34" width="8" height="10" rx="2" fill="#6f7790" stroke="#232734" strokeWidth="1.2" />)
        : <rect x={x0 + width / 2 - 14} y="26" width="28" height="18" rx="4" fill="#9aa1b3" stroke="#232734" strokeWidth="1.5" />}

      {/* turbo on the right */}
      {turbo && (
        <g>
          <path d={`M${x0 + width},90 h18`} stroke="#8a6a55" strokeWidth="9" strokeLinecap="round" />
          <circle cx={x0 + width + 36} cy="92" r="24" fill="#aab0c0" stroke="#232734" strokeWidth="2.5" />
          <circle cx={x0 + width + 36} cy="92" r="10" fill="#4a4f5d" stroke="#232734" strokeWidth="2" />
          <path d={`M${x0 + width + 36},68 V44 H${x0 + width - 20}`} stroke="#c3c8d3" strokeWidth="7" fill="none" strokeLinecap="round" />
        </g>
      )}
    </svg>
  )
}
