import type { ComponentType } from 'react'
import {
  Anchor, Atom, Bird, Cat, Cog, Compass, Crown, Dog, Fish, Flag, Flame, Gauge, Gem, Infinity as InfinityIcon, Leaf,
  Moon, Mountain, Orbit, Plane, Rabbit, Rocket, Shield, Skull, Snowflake, Squirrel, Star, Sun, Swords, Target,
  Trophy, Wind, Waves, Zap, type LucideProps,
} from 'lucide-react'
import { LOGO_SYMBOLS } from '../data/foundation'
import type { LogoChoice } from '../core/foundation'
import styles from './CompanyLogo.module.css'

const SYMBOL_ICONS: Record<(typeof LOGO_SYMBOLS)[number], ComponentType<LucideProps>> = {
  Flame, Zap, Star, Crown, Rocket, Shield, Anchor, Compass, Mountain, Sun, Moon, Bird, Cat, Dog, Fish, Gem, Leaf,
  Wind, Waves, Swords, Trophy, Flag, Cog, Gauge, Atom, Rabbit, Squirrel, Snowflake, Skull, Target, Orbit,
  Infinity: InfinityIcon, Plane,
}

/** The badge shapes behind the symbol, drawn in a 100x100 box. */
const FORMS: string[] = [
  'M50 4 L90 18 V50 C90 74 72 90 50 97 C28 90 10 74 10 50 V18 Z',
  'M50 4 A46 46 0 1 1 49.9 4 Z',
  'M50 4 L90 27 V73 L50 96 L10 73 V27 Z',
  'M32 6 H68 L94 32 V68 L68 94 H32 L6 68 V32 Z',
  'M50 4 L96 50 L50 96 L4 50 Z',
  'M26 6 H74 A20 20 0 0 1 94 26 V74 A20 20 0 0 1 74 94 H26 A20 20 0 0 1 6 74 V26 A20 20 0 0 1 26 6 Z',
  'M50 5 L95 38 L78 92 H22 L5 38 Z',
  'M12 12 H88 V52 C88 76 70 90 50 97 C30 90 12 76 12 52 Z',
]

let nextId = 0

/** The company badge: a coloured shape with an icon on it. Both colours come from a hue (0-360). */
export function CompanyLogo({ logo, size = 96 }: { logo: LogoChoice; size?: number }) {
  const Icon = SYMBOL_ICONS[LOGO_SYMBOLS[logo.symbol % LOGO_SYMBOLS.length]]
  const path = FORMS[logo.form % FORMS.length]
  const id = `logo-${(nextId = (nextId + 1) % 1_000_000)}`
  return (
    <span className={styles.logo} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={`hsl(${logo.formHue} 70% 62%)`} />
            <stop offset="1" stopColor={`hsl(${logo.formHue} 70% 26%)`} />
          </linearGradient>
        </defs>
        <path d={path} fill={`url(#${id})`} stroke={`hsl(${logo.formHue} 60% 78%)`} strokeWidth="3" strokeLinejoin="round" />
      </svg>
      <Icon className={styles.symbol} size={size * 0.5} strokeWidth={2.2} color={`hsl(${logo.symbolHue} 90% 80%)`} />
    </span>
  )
}
