import type { ReactElement } from 'react'
import type { FlagId } from '../data/foundation'

/** Simple flat flags for the HQ cards, drawn in a 60x40 box. */
export function Flag({ id }: { id: FlagId }) {
  return (
    <svg viewBox="0 0 60 40" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true">
      {FLAGS[id]}
    </svg>
  )
}

const FLAGS: Record<FlagId, ReactElement> = {
  mexico: (
    <>
      <rect width="20" height="40" fill="#1f8a4c" />
      <rect x="20" width="20" height="40" fill="#f4f4f4" />
      <rect x="40" width="20" height="40" fill="#d62b3a" />
      <circle cx="30" cy="20" r="5" fill="#a9743a" />
    </>
  ),
  brazil: (
    <>
      <rect width="60" height="40" fill="#1d9a4a" />
      <path d="M30 4 L56 20 L30 36 L4 20 Z" fill="#f5d33a" />
      <circle cx="30" cy="20" r="9" fill="#243f9c" />
      <path d="M21.5 18 Q30 15 38.5 22" stroke="#fff" strokeWidth="1.6" fill="none" />
    </>
  ),
  usa: (
    <>
      <rect width="60" height="40" fill="#f4f4f4" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} y={i * 5.72} width="60" height="2.86" fill="#c8283c" />
      ))}
      <rect width="26" height="22" fill="#2a3b8f" />
      {[0, 1, 2, 3].flatMap((r) => [0, 1, 2, 3, 4].map((c) => <circle key={`${r}-${c}`} cx={3 + c * 5} cy={3.5 + r * 5} r="0.9" fill="#fff" />))}
    </>
  ),
  uk: (
    <>
      <rect width="60" height="40" fill="#25397f" />
      <path d="M0 0 L60 40 M60 0 L0 40" stroke="#f4f4f4" strokeWidth="7" />
      <path d="M0 0 L60 40 M60 0 L0 40" stroke="#c8283c" strokeWidth="2.4" />
      <path d="M30 0 V40 M0 20 H60" stroke="#f4f4f4" strokeWidth="11" />
      <path d="M30 0 V40 M0 20 H60" stroke="#c8283c" strokeWidth="6" />
    </>
  ),
  germany: (
    <>
      <rect width="60" height="14" fill="#1c1c1c" />
      <rect y="13" width="60" height="14" fill="#d62b2b" />
      <rect y="26" width="60" height="14" fill="#f2c230" />
    </>
  ),
  italy: (
    <>
      <rect width="20" height="40" fill="#1f8a4c" />
      <rect x="20" width="20" height="40" fill="#f4f4f4" />
      <rect x="40" width="20" height="40" fill="#d62b3a" />
    </>
  ),
  japan: (
    <>
      <rect width="60" height="40" fill="#f4f4f4" />
      <circle cx="30" cy="20" r="11" fill="#c8283c" />
    </>
  ),
  sweden: (
    <>
      <rect width="60" height="40" fill="#1f5fae" />
      <rect x="17" width="9" height="40" fill="#f5d33a" />
      <rect y="15.5" width="60" height="9" fill="#f5d33a" />
    </>
  ),
}
