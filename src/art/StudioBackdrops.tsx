/** Two more backdrops for the designer, like the reference: the bright paint shop used for
 * Appearance and Interior, and the dark wind tunnel used for Aerodynamics. */

export function PaintShopBackdrop({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="ps-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dfe6ef" />
          <stop offset="1" stopColor="#aab4c4" />
        </linearGradient>
        <linearGradient id="ps-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8d97a8" />
          <stop offset="1" stopColor="#252b3a" />
        </linearGradient>
        <linearGradient id="ps-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a1030" stopOpacity="0.55" />
          <stop offset="0.35" stopColor="#0a1030" stopOpacity="0" />
          <stop offset="0.75" stopColor="#0a1030" stopOpacity="0" />
          <stop offset="1" stopColor="#050818" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <rect width="800" height="400" fill="url(#ps-wall)" />
      {/* wall panels with light strips */}
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x={i * 170 - 10} y="60" width="150" height="250" fill="#c8d0de" stroke="#9aa5b8" strokeWidth="2" />
          <rect x={i * 170 + 10} y="90" width="110" height="26" rx="3" fill="#fff" />
          <rect x={i * 170 + 10} y="170" width="110" height="26" rx="3" fill="#fff" />
        </g>
      ))}
      {/* wheels, steering wheels and a seat on display */}
      {[110, 160, 210].map((y) => (
        <g key={y} transform={`translate(175 ${y - 70})`}>
          <circle r="26" fill="#cfd5df" stroke="#6c7587" strokeWidth="4" />
          <circle r="7" fill="#6c7587" />
          {[0, 45, 90, 135].map((a) => <line key={a} x1="0" y1="-24" x2="0" y2="24" stroke="#6c7587" strokeWidth="2.5" transform={`rotate(${a})`} />)}
        </g>
      ))}
      {[90, 140, 190].map((y, i) => (
        <g key={y} transform={`translate(555 ${y - 20})`}>
          <circle r="22" fill="none" stroke={['#3b3f4d', '#a37b3a', '#3b3f4d'][i]} strokeWidth="5" />
          <line x1="-22" y1="0" x2="22" y2="0" stroke="#3b3f4d" strokeWidth="4" />
        </g>
      ))}
      <path d="M690 140 q-18 4 -16 30 l4 90 h50 l6 -90 q2 -26 -18 -30 Z" fill="#41475a" stroke="#232734" strokeWidth="3" />
      <rect y="300" width="800" height="100" fill="url(#ps-floor)" />
      <rect width="800" height="400" fill="url(#ps-fade)" />
    </svg>
  )
}

export function WindTunnelBackdrop({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="wt-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b303c" />
          <stop offset="1" stopColor="#14171f" />
        </linearGradient>
      </defs>
      <rect width="800" height="400" fill="url(#wt-wall)" />
      <rect x="420" y="150" width="140" height="120" fill="#555a66" opacity="0.55" />
      {[0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1="420" x2="560" y1={160 + i * 18} y2={160 + i * 18} stroke="#2a2e38" strokeWidth="3" />)}
      {/* airflow */}
      {[150, 170, 190, 210, 235, 260].map((y, i) => (
        <path key={y} d={`M330 ${y} Q470 ${y - 24 + i * 3} 640 ${y + 4}`} stroke="rgba(255,255,255,0.28)" strokeWidth="1.6" fill="none" />
      ))}
      <path d="M598 188 l16 6 l-16 6 Z" fill="rgba(255,255,255,0.5)" />
      {/* hazard-striped floor */}
      <polygon points="0,300 800,300 800,400 0,400" fill="#171a22" />
      {Array.from({ length: 14 }, (_, i) => (
        <polygon key={i} points={`${i * 70 - 40},400 ${i * 70},400 ${i * 70 + 60},300 ${i * 70 + 30},300`} fill="#d9b92e" opacity="0.8" />
      ))}
      <rect y="296" width="800" height="6" fill="#d9b92e" opacity="0.5" />
    </svg>
  )
}
