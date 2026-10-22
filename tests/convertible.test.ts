import { describe, expect, it } from 'vitest'
import { applyConvertible, CONVERTIBLE, calculateCarSpecs } from '../src/core/carSpecsCalculator'
import { BODIES, BODY_STYLE_ORDER, designsOfStyle } from '../src/data/bodies'
import { DEFAULT_ENGINE_SPEC } from '../src/core/vehicles'
import { TechModifiers } from '../src/core/techModifiers'
import {
  beginNewDesign,
  createVehicleState,
  finalizeDesign,
  selectBody,
  setNameAndCategory,
  toolingCost,
  toolingKey,
} from '../src/core/vehicleService'
import { createBank } from '../src/core/economy'
import { createLedgerState } from '../src/core/ledger'
import { unlockedByYear } from '../src/core/unlocks'
import { makeDate } from '../src/core/gameDate'

const body = BODIES.find((b) => b.id === 'classic-saloon')!
const today = makeDate(1970, 1, 1)

describe('body styles and designs', () => {
  it('every body belongs to a listed style, earliest design first', () => {
    for (const b of BODIES) expect(BODY_STYLE_ORDER).toContain(b.carClass)
    for (const style of BODY_STYLE_ORDER) {
      const years = designsOfStyle(style).map((d) => d.unlockYear)
      expect(years).toEqual([...years].sort((a, c) => a - c))
    }
    expect(BODY_STYLE_ORDER.reduce((n, s) => n + designsOfStyle(s).length, 0)).toBe(BODIES.length)
  })
})

describe('convertible', () => {
  it('costs more, weighs more, is less safe and better looking', () => {
    const base = calculateCarSpecs(body, DEFAULT_ENGINE_SPEC, new TechModifiers())
    const open = applyConvertible({ ...base, designStats: { ...base.designStats, safety: 50, attractiveness: 50 } })
    expect(open.unitCost).toBeCloseTo(base.unitCost * CONVERTIBLE.unitCostMultiplier)
    expect(open.weightKg).toBe(base.weightKg + CONVERTIBLE.extraWeightKg)
    expect(open.designStats.safety).toBe(50 + CONVERTIBLE.safety)
    expect(open.designStats.attractiveness).toBe(50 + CONVERTIBLE.attractiveness)
  })

  it('needs its own tooling, which costs 15% more', () => {
    expect(toolingCost(body, true)).toBe(Math.round(body.productionEquipmentCost * 1.15))
    const vehicles = createVehicleState()
    const bank = createBank(1e9)
    expect(selectBody(vehicles, body, bank, createLedgerState(), unlockedByYear(1970), today, true)).toBe(true)
    expect(vehicles.tooledBodyIds).toContain(toolingKey(body.id, true))
    expect(vehicles.tooledBodyIds).not.toContain(body.id)
    expect(bank.balance).toBe(1e9 - toolingCost(body, true))
  })

  it('a finished convertible model remembers its roof is off', () => {
    const vehicles = createVehicleState()
    beginNewDesign(vehicles)
    selectBody(vehicles, body, createBank(1e9), createLedgerState(), unlockedByYear(1970), today, true)
    setNameAndCategory(vehicles, 'Open Test', 'TEST')
    const model = finalizeDesign(vehicles, BODIES, new TechModifiers(), today)
    expect(model?.convertible).toBe(true)
  })
})
