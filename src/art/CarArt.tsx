import { useId } from 'react'
import { shade } from './iso'

/** One body style's side profile, front facing right, drawn in a 260 x 112 box. */
interface CarProfile {
  body: string
  windows: string[]
  wheelsX: [number, number]
  wheelY: number
  wheelR: number
  /** Extra outline-only details: door seams, bed rails. */
  lines?: string[]
  /** [x, y] of the headlight (front, right) and taillight (rear, left). */
  headlight: [number, number]
  taillight: [number, number]
  /** Spare wheel on the tailgate (off-roaders). */
  spare?: [number, number, number]
  /** Filled extras in body color, e.g. a roadster's headrest fairing. */
  bodyExtras?: string[]
}

const PROFILES: Record<string, CarProfile> = {
  'classic-saloon': {
    body: 'M20,78 Q18,62 34,58 L70,54 Q84,34 104,32 L156,32 Q172,33 184,52 L226,56 Q242,58 242,74 L242,80 Q240,84 234,84 L204,84 A20,20 0 0 0 166,84 L94,84 A20,20 0 0 0 56,84 L26,84 Q20,84 20,78 Z',
    windows: ['M80,54 L97,37 Q103,35 110,35 L126,35 L126,54 Z', 'M131,35 L154,35 Q165,36 175,53 L131,54 Z'],
    lines: ['M128,36 L128,82', 'M96,56 L96,80'],
    wheelsX: [75, 185],
    wheelY: 84,
    wheelR: 15,
    headlight: [236, 64],
    taillight: [23, 66],
  },
  'executive-sedan': {
    body: 'M14,76 L16,62 Q18,58 26,57 L72,54 L96,32 L170,32 L196,54 L236,56 Q246,57 246,66 L246,80 Q246,84 240,84 L210,84 A20,20 0 0 0 172,84 L92,84 A20,20 0 0 0 54,84 L20,84 Q14,84 14,76 Z',
    windows: ['M80,54 L99,36 L131,36 L131,54 Z', 'M136,36 L167,36 L188,54 L136,54 Z'],
    lines: ['M133,36 L133,82', 'M98,56 L98,80', 'M18,66 L244,66'],
    wheelsX: [73, 191],
    wheelY: 84,
    wheelR: 15,
    headlight: [240, 62],
    taillight: [18, 64],
  },
  'trail-suv': {
    body: 'M24,82 L24,22 Q24,16 30,16 L176,16 L198,44 L228,48 Q238,50 238,60 L238,82 Q238,88 232,88 L210,88 A22,22 0 0 0 166,88 L98,88 A22,22 0 0 0 54,88 L30,88 Q24,88 24,82 Z',
    windows: ['M32,22 L78,22 L78,42 L32,42 Z', 'M84,22 L128,22 L128,44 L84,44 Z', 'M134,22 L172,22 L190,44 L134,44 Z'],
    lines: ['M131,22 L131,84', 'M81,22 L81,84'],
    wheelsX: [76, 188],
    wheelY: 88,
    wheelR: 18,
    headlight: [232, 56],
    taillight: [27, 52],
    spare: [18, 56, 12],
  },
  'grand-suv': {
    body: 'M14,80 L16,30 Q18,20 30,19 L170,18 Q182,18 190,26 L208,44 L234,48 Q246,50 246,62 L246,82 Q246,88 240,88 L214,88 A22,22 0 0 0 170,88 L96,88 A22,22 0 0 0 52,88 L20,88 Q14,88 14,80 Z',
    windows: ['M26,26 L70,25 L70,44 L24,44 Z', 'M76,25 L124,24 L124,45 L76,45 Z', 'M130,24 L168,24 Q176,24 182,30 L196,45 L130,45 Z'],
    lines: ['M127,24 L127,84', 'M73,25 L73,84', 'M16,62 L246,62'],
    wheelsX: [74, 192],
    wheelY: 88,
    wheelR: 18,
    headlight: [240, 56],
    taillight: [18, 50],
  },
  roadster: {
    body: 'M16,76 Q16,62 26,60 L96,58 L160,58 L222,62 Q240,64 242,74 L242,78 Q242,82 236,82 L206,82 A18,18 0 0 0 170,82 L88,82 A18,18 0 0 0 52,82 L22,82 Q16,82 16,76 Z',
    windows: ['M158,58 L145,40 L149,40 L163,58 Z'],
    bodyExtras: ['M96,58 Q100,46 108,46 Q116,46 118,58 Z'],
    lines: ['M124,60 L124,80'],
    wheelsX: [70, 188],
    wheelY: 82,
    wheelR: 15,
    headlight: [236, 66],
    taillight: [19, 66],
  },
  'gt-coupe': {
    body: 'M12,74 Q14,62 26,60 L58,56 Q90,30 122,30 L140,30 Q154,31 168,50 L232,56 Q248,58 248,72 L248,78 Q248,84 240,84 L214,84 A19,19 0 0 0 176,84 L84,84 A19,19 0 0 0 46,84 L18,84 Q12,84 12,78 Z',
    windows: ['M70,54 Q94,36 118,34 L118,54 Z', 'M124,34 L138,34 Q150,35 160,52 L124,54 Z'],
    bodyExtras: ['M12,60 L30,57 L30,54 L12,57 Z'],
    lines: ['M121,34 L121,82'],
    wheelsX: [65, 195],
    wheelY: 84,
    wheelR: 15,
    headlight: [242, 64],
    taillight: [15, 66],
  },
  'compact-coupe': {
    body: 'M40,78 L42,52 Q44,44 54,42 L72,28 Q78,24 88,24 L146,24 Q156,25 166,40 L204,48 Q218,50 220,62 L220,78 Q220,84 214,84 L196,84 A18,18 0 0 0 160,84 L102,84 A18,18 0 0 0 66,84 L46,84 Q40,84 40,78 Z',
    windows: ['M54,46 L74,30 Q80,27 88,27 L110,27 L110,46 Z', 'M116,27 L144,27 Q152,28 160,42 L116,46 Z'],
    lines: ['M113,27 L113,82'],
    wheelsX: [84, 178],
    wheelY: 84,
    wheelR: 15,
    headlight: [214, 58],
    taillight: [43, 56],
  },
  pickup: {
    body: 'M14,82 L14,48 L112,48 L112,24 Q112,18 118,18 L168,18 Q174,18 178,24 L192,46 L232,50 Q246,52 246,64 L246,84 Q246,88 240,88 L216,88 A21,21 0 0 0 174,88 L92,88 A21,21 0 0 0 50,88 L20,88 Q14,88 14,82 Z',
    windows: ['M120,24 L166,24 L180,46 L120,46 Z'],
    lines: ['M18,53 L108,53', 'M112,48 L112,86', 'M150,24 L150,84'],
    wheelsX: [71, 195],
    wheelY: 88,
    wheelR: 17,
    headlight: [240, 60],
    taillight: [17, 56],
  },
}

/** Bare-metal silver for a body shell on the tooling line; saturated colors for finished models. */
export const BARE_METAL = '#d9dde4'
const MODEL_COLORS = ['#c9473a', '#2f6ee6', '#f2b53c', '#3f9a55', '#e8e8ec', '#2b2f3a', '#8e44ad', '#e67e22']

/** A stable paint color for a finished model, derived from its id so it never changes between
 * visits (models don't store a paint color of their own). */
export function modelPaint(modelId: string): string {
  let hash = 0
  for (const ch of modelId) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return MODEL_COLORS[Math.abs(hash) % MODEL_COLORS.length]
}

interface CarArtProps {
  bodyId: string
  color?: string
  /** 'bare': an unpainted shell up on orange jack stands, no wheels - the Body Selection look. */
  variant?: 'finished' | 'bare'
  className?: string
  title?: string
}

/** Side-view vector drawing of a body style. */
export function CarArt({ bodyId, color, variant = 'finished', className, title }: CarArtProps) {
  const uid = useId().replace(/:/g, '')
  const profile = PROFILES[bodyId] ?? PROFILES['classic-saloon']
  const paint = color ?? (variant === 'bare' ? BARE_METAL : '#c9473a')
  const outline = shade(paint, 0.45)
  const groundY = profile.wheelY + profile.wheelR
  const bare = variant === 'bare'

  return (
    <svg className={className} viewBox="0 0 260 112" role="img" aria-label={title} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={`${uid}-paint`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(paint, 1.22)} />
          <stop offset="0.55" stopColor={paint} />
          <stop offset="1" stopColor={shade(paint, 0.72)} />
        </linearGradient>
        <linearGradient id={`${uid}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c8dcf2" />
          <stop offset="1" stopColor="#5f7da3" />
        </linearGradient>
      </defs>

      <ellipse cx={130} cy={groundY + 1} rx={118} ry={5} fill="#000" opacity={0.3} />

      {profile.spare && (
        <circle cx={profile.spare[0]} cy={profile.spare[1]} r={profile.spare[2]} fill="#24262c" stroke="#111" strokeWidth={1} />
      )}

      <path d={profile.body} fill={`url(#${uid}-paint)`} stroke={outline} strokeWidth={1.4} strokeLinejoin="round" />
      {profile.bodyExtras?.map((d) => <path key={d} d={d} fill={`url(#${uid}-paint)`} stroke={outline} strokeWidth={1.2} strokeLinejoin="round" />)}
      {profile.windows.map((d) => (
        <path key={d} d={d} fill={`url(#${uid}-glass)`} stroke={outline} strokeWidth={1.2} strokeLinejoin="round" />
      ))}
      {profile.lines?.map((d) => <path key={d} d={d} stroke={outline} strokeWidth={0.9} fill="none" opacity={0.7} />)}

      {/* Wheel arch shadows read as "the wheels go here" even on a bare shell. */}
      {bare &&
        profile.wheelsX.map((x) => (
          <circle key={x} cx={x} cy={profile.wheelY} r={profile.wheelR + 1} fill="#14182a" opacity={0.85} />
        ))}

      {/* Jack stands go in front of the arch shadows, holding the shell up where the wheels will be. */}
      {bare &&
        profile.wheelsX.map((x) => (
          <g key={x} fill="#f0a020" stroke="#9a5f06" strokeWidth={1}>
            <path d={`M${x - 11},${groundY} L${x - 3},${profile.wheelY - 6} L${x + 3},${profile.wheelY - 6} L${x + 11},${groundY} Z`} />
            <rect x={x - 6} y={profile.wheelY - 9} width={12} height={4} rx={1} />
          </g>
        ))}

      {!bare && (
        <>
          <rect x={profile.headlight[0] - 4} y={profile.headlight[1] - 3} width={8} height={6} rx={2} fill="#fff3c4" stroke={outline} strokeWidth={0.8} />
          <rect x={profile.taillight[0] - 3} y={profile.taillight[1] - 3} width={6} height={6} rx={1.5} fill="#e53935" stroke={outline} strokeWidth={0.8} />
          {profile.wheelsX.map((x) => (
            <g key={x}>
              <circle cx={x} cy={profile.wheelY} r={profile.wheelR} fill="#1f2228" stroke="#0c0d10" strokeWidth={1} />
              <circle cx={x} cy={profile.wheelY} r={profile.wheelR * 0.58} fill="#b9c0cc" stroke="#6b7280" strokeWidth={1} />
              <circle cx={x} cy={profile.wheelY} r={profile.wheelR * 0.18} fill="#6b7280" />
            </g>
          ))}
        </>
      )}
    </svg>
  )
}
