import { describe, expect, it } from 'vitest'
import {
  createVehicleState,
  beginNewDesign,
  selectBody,
  setEnginePreset,
  toggleClassificationTag,
} from '../src/core/vehicleService'
import { createBank } from '../src/core/economy'
import { createLedgerState } from '../src/core/ledger'
import { makeDate } from '../src/core/gameDate'
import { findEnginePreset } from '../src/data/enginePresets'
import { DESIGN_STEPS } from '../src/data/designSteps'
import type { BodyStyleDefinition } from '../src/core/vehicles'

const TODAY = makeDate(1974, 1, 1)

const bigBody: BodyStyleDefinition = {
  id: 'big-body',
  displayName: 'Big Body',
  carClass: 'SUV',
  engineBayCapacityLiters: 7,
  baseWeightKg: 2000,
  productionEquipmentCost: 0,
  baseUnitCost: 5000,
  unlockYear: 1950,
}

const smallBody: BodyStyleDefinition = {
  id: 'small-body',
  displayName: 'Small Body',
  carClass: 'Coupe',
  engineBayCapacityLiters: 1.2,
  baseWeightKg: 900,
  productionEquipmentCost: 0,
  baseUnitCost: 2500,
  unlockYear: 1950,
}

describe('selectBody', () => {
  it('seeds every component slot with a default option and a fitting, unlocked engine preset', () => {
    const vehicles = createVehicleState()
    const bank = createBank(1_000_000)
    const ledger = createLedgerState()
    beginNewDesign(vehicles)

    selectBody(vehicles, bigBody, bank, ledger, 1974, TODAY)

    const session = vehicles.currentSession!
    const totalSlots = DESIGN_STEPS.flatMap((s) => s.slots).length
    expect(Object.keys(session.componentSelections)).toHaveLength(totalSlots)

    const preset = findEnginePreset(session.enginePresetId!)
    expect(preset).toBeDefined()
    expect(preset!.spec.displacementLiters).toBeLessThanOrEqual(bigBody.engineBayCapacityLiters)
    expect(preset!.unlockYear).toBeLessThanOrEqual(1974)
  })

  it('re-picks a fitting engine preset when a bigger preset no longer fits a newly selected body', () => {
    const vehicles = createVehicleState()
    const bank = createBank(1_000_000)
    const ledger = createLedgerState()
    beginNewDesign(vehicles)

    selectBody(vehicles, bigBody, bank, ledger, 1974, TODAY)
    setEnginePreset(vehicles, 'muscle-v8') // 5.0L - fits the 7L body, would not fit the 1.2L one
    expect(vehicles.currentSession!.engine.displacementLiters).toBe(5.0)

    selectBody(vehicles, smallBody, bank, ledger, 1974, TODAY)

    expect(vehicles.currentSession!.engine.displacementLiters).toBeLessThanOrEqual(smallBody.engineBayCapacityLiters)
    const preset = findEnginePreset(vehicles.currentSession!.enginePresetId!)
    expect(preset!.spec.displacementLiters).toBeLessThanOrEqual(smallBody.engineBayCapacityLiters)
  })

  it('leaves an engine preset untouched when the newly selected body can still fit it', () => {
    const vehicles = createVehicleState()
    const bank = createBank(1_000_000)
    const ledger = createLedgerState()
    beginNewDesign(vehicles)

    selectBody(vehicles, bigBody, bank, ledger, 1974, TODAY)
    setEnginePreset(vehicles, 'standard-i4') // 1.6L - fits both bodies
    selectBody(vehicles, bigBody, bank, ledger, 1974, TODAY) // re-selecting the same body shouldn't reset it

    expect(vehicles.currentSession!.enginePresetId).toBe('standard-i4')
  })
})

describe('toggleClassificationTag', () => {
  it('selects one class tag and one type tag, deselects an already-selected one', () => {
    const vehicles = createVehicleState()
    beginNewDesign(vehicles)

    toggleClassificationTag(vehicles, 'medium') // class
    toggleClassificationTag(vehicles, 'sport') // type
    expect(vehicles.currentSession!.classificationTagIds).toEqual(['medium', 'sport'])

    toggleClassificationTag(vehicles, 'medium') // deselect
    expect(vehicles.currentSession!.classificationTagIds).toEqual(['sport'])
  })

  it('picking a new tag in an already-filled category replaces that category\'s tag, not the other one', () => {
    const vehicles = createVehicleState()
    beginNewDesign(vehicles)

    toggleClassificationTag(vehicles, 'medium') // class
    toggleClassificationTag(vehicles, 'sport') // type
    toggleClassificationTag(vehicles, 'luxury') // another class tag - should replace 'medium', not 'sport'

    expect(vehicles.currentSession!.classificationTagIds).toEqual(['sport', 'luxury'])
  })
})
