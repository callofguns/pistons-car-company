/** What a completed research node can nudge on a car design. Direct port of TechModifiers.cs. */
export type TechTarget =
  | 'Power'
  | 'Reliability'
  | 'FuelEconomy'
  | 'Emissions'
  | 'ProductionCost'
  | 'RepairCost'

/** One line item of a research node's payoff, e.g. "+4% Power". Amount is fractional (0.04 = +4%), negative reduces the target. */
export interface TechEffect {
  target: TechTarget
  amount: number
}

/** Running total of every researched node's effects, aggregated by target. Mutable by design - `apply` accumulates in place, matching how research completion folds effects in as it happens. */
export class TechModifiers {
  private totals = new Map<TechTarget, number>()

  get(target: TechTarget): number {
    return this.totals.get(target) ?? 0
  }

  apply(effects: TechEffect[]): void {
    for (const effect of effects) {
      this.totals.set(effect.target, this.get(effect.target) + effect.amount)
    }
  }

  reset(): void {
    this.totals.clear()
  }

  clone(): TechModifiers {
    const copy = new TechModifiers()
    for (const [target, amount] of this.totals) copy.totals.set(target, amount)
    return copy
  }
}
