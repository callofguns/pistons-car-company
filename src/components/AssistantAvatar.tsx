/** Ben Gross, the assistant who walks you through setting up the company - a flat drawing of a
 * bearded man in a navy suit holding a folder. */
export function AssistantAvatar() {
  return (
    <svg viewBox="0 0 300 480" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <defs>
        <linearGradient id="suit" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2f5bb0" />
          <stop offset="1" stopColor="#1a3470" />
        </linearGradient>
      </defs>
      {/* jacket */}
      <path d="M6 480 C6 372 26 316 104 292 L196 292 C274 316 294 372 294 480 Z" fill="url(#suit)" stroke="#0e1a40" strokeWidth="3" />
      {/* shirt and tie */}
      <path d="M118 292 L150 372 L182 292 Z" fill="#dfe8ff" />
      <path d="M142 306 H158 L164 392 L150 418 L136 392 Z" fill="#8e95a8" stroke="#3a3f55" strokeWidth="2" />
      {/* lapels */}
      <path d="M104 292 L146 392 L122 480 L64 480 L62 360 Z" fill="#274a96" stroke="#0e1a40" strokeWidth="2" />
      <path d="M196 292 L154 392 L178 480 L236 480 L238 360 Z" fill="#274a96" stroke="#0e1a40" strokeWidth="2" />
      {/* neck */}
      <rect x="128" y="250" width="44" height="52" rx="10" fill="#d99a6c" />
      {/* head */}
      <ellipse cx="150" cy="186" rx="56" ry="68" fill="#e8b186" />
      {/* hair */}
      <path d="M92 168 C88 108 128 92 160 98 C196 96 214 124 208 168 C200 140 184 126 150 124 C122 124 100 140 92 168 Z" fill="#3a2e2a" />
      {/* beard */}
      <path d="M96 190 C100 252 126 262 150 262 C174 262 200 252 204 190 C196 218 178 226 150 226 C122 226 104 218 96 190 Z" fill="#2a2220" />
      <path d="M130 232 C140 238 160 238 170 232" stroke="#e8b186" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* face */}
      <path d="M118 158 Q128 152 140 158 M160 158 Q172 152 182 158" stroke="#2a2220" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="130" cy="172" r="6" fill="#fff" />
      <circle cx="170" cy="172" r="6" fill="#fff" />
      <circle cx="130" cy="172" r="3.6" fill="#3c8a5a" />
      <circle cx="170" cy="172" r="3.6" fill="#3c8a5a" />
      <path d="M150 176 L146 200 H156" stroke="#c88a60" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* folder */}
      <g transform="rotate(-20 220 400)">
        <rect x="150" y="360" width="150" height="116" rx="8" fill="#5a5f6e" stroke="#2a2e3a" strokeWidth="3" />
        <rect x="156" y="366" width="138" height="104" rx="6" fill="#6c7282" />
      </g>
      {/* hand */}
      <ellipse cx="198" cy="448" rx="20" ry="14" fill="#e8b186" />
    </svg>
  )
}
