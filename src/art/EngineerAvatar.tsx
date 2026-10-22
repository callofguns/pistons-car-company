/** The engineer who gives advice on the Safety Rating screen: a grey-bearded man in a yellow hard
 * hat and white coat, holding rolled blueprints. */
export function EngineerAvatar() {
  return (
    <svg viewBox="0 0 220 300" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      {/* coat */}
      <path d="M8 300 C8 220 26 176 78 160 L142 160 C194 176 212 220 212 300 Z" fill="#eef2fb" stroke="#4b5675" strokeWidth="3" />
      <path d="M92 160 L110 214 L128 160 Z" fill="#6f87b8" />
      <path d="M104 172 H116 L119 224 L110 238 L101 224 Z" fill="#5a6b8c" />
      <path d="M78 160 L108 232 L96 300" fill="none" stroke="#b5bfd6" strokeWidth="2.5" />
      <path d="M142 160 L112 232 L124 300" fill="none" stroke="#b5bfd6" strokeWidth="2.5" />
      {/* neck and head */}
      <rect x="92" y="134" width="36" height="34" rx="8" fill="#d99a6c" />
      <ellipse cx="110" cy="100" rx="40" ry="48" fill="#e8b186" />
      {/* beard */}
      <path d="M72 112 C76 150 94 158 110 158 C126 158 144 150 148 112 C142 132 128 138 110 138 C92 138 78 132 72 112 Z" fill="#aab1bd" />
      {/* face */}
      <path d="M88 96 Q96 91 104 96 M116 96 Q124 91 132 96" stroke="#7b838f" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="95" cy="107" r="4.5" fill="#fff" />
      <circle cx="125" cy="107" r="4.5" fill="#fff" />
      <circle cx="95" cy="107" r="2.6" fill="#4a7ea8" />
      <circle cx="125" cy="107" r="2.6" fill="#4a7ea8" />
      <path d="M96 128 Q110 136 124 128" stroke="#8a5a3c" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* hard hat */}
      <path d="M64 80 C64 40 90 26 110 26 C130 26 156 40 156 80 Z" fill="#f6c431" stroke="#a97d0c" strokeWidth="3" />
      <rect x="56" y="76" width="108" height="12" rx="6" fill="#e7b01e" stroke="#a97d0c" strokeWidth="3" />
      <rect x="102" y="26" width="16" height="50" fill="#e7b01e" opacity="0.7" />
      {/* blueprints */}
      <g transform="rotate(-24 150 250)">
        <rect x="96" y="226" width="104" height="30" rx="14" fill="#4a68c4" stroke="#27397a" strokeWidth="3" />
        <path d="M110 236 H186 M110 246 H176" stroke="#9fb4ee" strokeWidth="2" />
      </g>
      <ellipse cx="124" cy="262" rx="16" ry="12" fill="#e8b186" />
    </svg>
  )
}
