import type { HQLevelDefinition } from '../core/hq'

/** The five-rung HQ ladder. Upgrading gives more staff slots and more room for production lines
 * (see core/factory.ts's maxLines), at a higher monthly overhead. Sized for the $45M starting
 * company - Global HQ is a serious late-game investment. */
export const HQ_LEVELS: HQLevelDefinition[] = [
  { level: 1, displayNameKey: 'data.hqLevel.1.name', slots: 3, monthlyOverhead: 500_000, upgradeCost: 0 },
  { level: 2, displayNameKey: 'data.hqLevel.2.name', slots: 6, monthlyOverhead: 1_000_000, upgradeCost: 4_000_000 },
  { level: 3, displayNameKey: 'data.hqLevel.3.name', slots: 10, monthlyOverhead: 2_000_000, upgradeCost: 15_000_000 },
  { level: 4, displayNameKey: 'data.hqLevel.4.name', slots: 15, monthlyOverhead: 4_000_000, upgradeCost: 45_000_000 },
  { level: 5, displayNameKey: 'data.hqLevel.5.name', slots: 22, monthlyOverhead: 8_000_000, upgradeCost: 120_000_000 },
]

export function findHqLevel(level: number): HQLevelDefinition | undefined {
  return HQ_LEVELS.find((l) => l.level === level)
}
