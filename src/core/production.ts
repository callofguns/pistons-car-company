import { canAfford, tryWithdraw, type BankState } from './economy'
import type { CarModel } from './vehicles'

const BASE_UNITS_PER_DAY_FRACTION = 0.015 // a model can, at baseline, produce ~1.5% of its planned run per day

/**
 * Builds daily stock for every model still short of its plannedProductionRun, charging unitCost
 * per unit from the bank and throttling output to whatever cash can actually cover. Runs even for
 * models withdrawn from sale, so "Withdrawn from sale" stops selling without stopping the
 * factory. Direct port of ProductionService.cs.
 */
export function onProductionDayTick(models: CarModel[], bank: BankState, productionSpeedBonusPercent: number): void {
  const speedMultiplier = 1 + productionSpeedBonusPercent / 100

  for (const model of models) {
    const remainingToBuild = model.plannedProductionRun - model.totalProduced
    if (remainingToBuild <= 0) continue

    const desiredUnits = Math.max(1, Math.round(model.plannedProductionRun * BASE_UNITS_PER_DAY_FRACTION * speedMultiplier))
    let units = Math.min(desiredUnits, remainingToBuild)

    // Throttle to what the bank can actually afford today rather than producing on credit.
    while (units > 0 && !canAfford(bank, units * model.unitCost)) units--
    if (units <= 0) continue

    const cost = units * model.unitCost
    if (!tryWithdraw(bank, cost)) continue

    model.inventory += units
    model.totalProduced += units
  }
}
