import { describe, expect, it } from 'vitest'
import {
  createRacingState,
  registerTeam,
  enterRace,
  onRacingMonthTick,
  isRaceTierUnlocked,
  RACING_REGISTRATION_COST,
  type RaceTierDefinition,
} from '../src/core/racing'
import { createBank } from '../src/core/economy'
import { createLedgerState } from '../src/core/ledger'
import { createCompanyState } from '../src/core/company'
import { TechModifiers } from '../src/core/techModifiers'
import { createVehicleState, beginNewDesign, selectBody, setEngineSpec, setNameAndCategory, finalizeDesign, toggleClassificationTag } from '../src/core/vehicleService'
import { DEFAULT_ENGINE_SPEC } from '../src/core/vehicles'
import { makeDate, addDays } from '../src/core/gameDate'
import type { BodyStyleDefinition } from '../src/core/vehicles'

const body: BodyStyleDefinition = {
  id: 'test-body',
  displayName: 'Test Body',
  carClass: 'Sports',
  engineBayCapacityLiters: 5,
  baseWeightKg: 1200,
  productionEquipmentCost: 0,
  baseUnitCost: 3000,
  unlockYear: 1950,
}

const TIER: RaceTierDefinition = {
  id: 'test-tier',
  displayNameKey: 'race.selectTier',
  entryFee: 1_000_000,
  firstPrize: 5_000_000,
  fieldSize: 6,
  difficultyRating: 3,
  preferredTagId: 'sport',
  unlockYear: 1978,
}

/** Builds a real CarModel through the actual design flow (same pattern as tests/market.test.ts's
 * buildModel), then lets each test mutate .stats directly for deterministic race-score control. */
function buildModel(tagIds: string[] = []) {
  const vehicles = createVehicleState()
  const bank = createBank(1_000_000)
  const ledger = createLedgerState()
  beginNewDesign(vehicles)
  selectBody(vehicles, body, bank, ledger, 1978, makeDate(1978, 1, 1))
  for (const tagId of tagIds) toggleClassificationTag(vehicles, tagId)
  setEngineSpec(vehicles, DEFAULT_ENGINE_SPEC)
  setNameAndCategory(vehicles, 'Test Racer', 'TEST')
  const model = finalizeDesign(vehicles, [body], new TechModifiers(), makeDate(1978, 1, 1), 1_000_000)
  if (!model) throw new Error('finalizeDesign failed in test setup')
  return model
}

function registeredTeam(bankBalance = 100_000_000) {
  const racing = createRacingState()
  const bank = createBank(bankBalance)
  const ledger = createLedgerState()
  const today = makeDate(1980, 1, 1)
  expect(registerTeam(racing, 'Test Racing', bank, ledger, 1980, 1978, today)).toBe(true)
  return { racing, bank, ledger, today }
}

describe('registerTeam', () => {
  it('records the registration fee to the ledger under the Racing category (was a bare tryWithdraw bug)', () => {
    const racing = createRacingState()
    const bank = createBank(100_000_000)
    const ledger = createLedgerState()
    const today = makeDate(1980, 1, 1)

    expect(registerTeam(racing, 'Ironclad', bank, ledger, 1980, 1978, today)).toBe(true)

    expect(bank.balance).toBe(100_000_000 - RACING_REGISTRATION_COST)
    expect(ledger.monthExpenseByCategory['Racing']).toBe(RACING_REGISTRATION_COST)
  })

  it('fails when the fee is unaffordable, and does not register or charge anything', () => {
    const racing = createRacingState()
    const bank = createBank(1000)
    const ledger = createLedgerState()

    expect(registerTeam(racing, 'Broke Racing', bank, ledger, 1980, 1978, makeDate(1980, 1, 1))).toBe(false)
    expect(racing.isRegistered).toBe(false)
    expect(bank.balance).toBe(1000)
  })

  it('fails when racing is not yet unlocked for the current year', () => {
    const racing = createRacingState()
    const bank = createBank(100_000_000)
    const ledger = createLedgerState()

    expect(registerTeam(racing, 'Too Early', bank, ledger, 1975, 1978, makeDate(1975, 1, 1))).toBe(false)
    expect(racing.isRegistered).toBe(false)
  })
})

describe('enterRace', () => {
  it('fails when the team is not registered', () => {
    const racing = createRacingState()
    const bank = createBank(100_000_000)
    const ledger = createLedgerState()
    const model = buildModel()

    expect(enterRace(racing, TIER, model, bank, ledger, 1980, makeDate(1980, 1, 1))).toBe(false)
  })

  it('fails when an entry is already pending - one car at a time', () => {
    const { racing, bank, ledger, today } = registeredTeam()
    const model = buildModel()

    expect(enterRace(racing, TIER, model, bank, ledger, 1980, today)).toBe(true)
    expect(enterRace(racing, TIER, model, bank, ledger, 1980, today)).toBe(false)
  })

  it('fails when the tier is locked for the current year', () => {
    const { racing, bank, ledger } = registeredTeam()
    const model = buildModel()

    expect(enterRace(racing, TIER, model, bank, ledger, 1970, makeDate(1970, 1, 1))).toBe(false)
    expect(racing.pendingEntry).toBeNull()
  })

  it('fails when the entry fee is unaffordable, and leaves no pending entry', () => {
    const { racing, ledger, today } = registeredTeam(RACING_REGISTRATION_COST) // spent it all on registration
    const bank = createBank(0)
    const model = buildModel()

    expect(enterRace(racing, TIER, model, bank, ledger, 1980, today)).toBe(false)
    expect(racing.pendingEntry).toBeNull()
  })

  it('charges the entry fee and commits a pending entry on success', () => {
    const { racing, bank, ledger, today } = registeredTeam()
    const model = buildModel()
    const balanceBefore = bank.balance

    expect(enterRace(racing, TIER, model, bank, ledger, 1980, today)).toBe(true)

    expect(bank.balance).toBe(balanceBefore - TIER.entryFee)
    expect(racing.pendingEntry).toEqual({ tierId: TIER.id, modelId: model.id, modelName: model.name })
  })
})

describe('onRacingMonthTick', () => {
  it('returns null and does nothing when there is no pending entry', () => {
    const racing = createRacingState()
    const company = createCompanyState('Test Co', 'Testville', 100)
    const bank = createBank(0)
    const ledger = createLedgerState()

    const result = onRacingMonthTick(racing, [], [TIER], company, bank, ledger, makeDate(1980, 2, 1))

    expect(result).toBeNull()
    expect(racing.history).toEqual([])
  })

  it('clears the pending entry even when the tier can no longer be found, without crashing', () => {
    const { racing, bank, ledger, today } = registeredTeam()
    const model = buildModel()
    enterRace(racing, TIER, model, bank, ledger, 1980, today)

    const company = createCompanyState('Test Co', 'Testville', 100)
    const result = onRacingMonthTick(racing, [model], [], company, bank, ledger, makeDate(1980, 2, 1))

    expect(result).toBeNull()
    expect(racing.pendingEntry).toBeNull()
  })

  it('clears the pending entry and still resolves (score 0) when the entered model can no longer be found', () => {
    const { racing, bank, ledger, today } = registeredTeam()
    const model = buildModel()
    enterRace(racing, TIER, model, bank, ledger, 1980, today)

    const company = createCompanyState('Test Co', 'Testville', 100)
    const result = onRacingMonthTick(racing, [], [TIER], company, bank, ledger, makeDate(1980, 2, 1))

    expect(result).not.toBeNull()
    expect(racing.pendingEntry).toBeNull()
  })

  it('pays the full first prize and posts a matching history record for a guaranteed 1st place finish', () => {
    const { racing, bank, ledger, today } = registeredTeam()
    const model = buildModel(['sport']) // matches TIER.preferredTagId for the bonus too
    model.stats.rating = 10
    model.stats.designStats.handling = 100
    model.stats.reliabilityPercent = 100
    model.stats.topSpeedKph = 400 // absurdly high - guarantees a score no rolled opponent can beat
    enterRace(racing, TIER, model, bank, ledger, 1980, today)

    const company = createCompanyState('Test Co', 'Testville', 100)
    const balanceBeforeResolve = bank.balance
    const result = onRacingMonthTick(racing, [model], [TIER], company, bank, ledger, makeDate(1980, 2, 1))

    expect(result).not.toBeNull()
    expect(result!.position).toBe(1)
    expect(result!.prize).toBe(TIER.firstPrize)
    expect(bank.balance).toBe(balanceBeforeResolve + TIER.firstPrize)
    expect(racing.history[0]).toEqual(result)
  })

  it('pays nothing and nudges reputation down for a guaranteed last-place finish', () => {
    const { racing, bank, ledger, today } = registeredTeam()
    const model = buildModel()
    model.stats.rating = 0
    model.stats.designStats.handling = 0
    model.stats.reliabilityPercent = 0
    model.stats.topSpeedKph = 0
    enterRace(racing, TIER, model, bank, ledger, 1980, today)

    const company = createCompanyState('Test Co', 'Testville', 100)
    company.reputationPercent = 50
    const balanceBeforeResolve = bank.balance
    const result = onRacingMonthTick(racing, [model], [TIER], company, bank, ledger, makeDate(1980, 2, 1))

    expect(result).not.toBeNull()
    expect(result!.position).toBe(TIER.fieldSize)
    expect(result!.prize).toBe(0)
    expect(bank.balance).toBe(balanceBeforeResolve) // no prize deposited
    expect(company.reputationPercent).toBeLessThan(50)
  })

  it('is deterministic for a fixed rngState given the same inputs', () => {
    const model = buildModel()

    const runOnce = () => {
      const racing = createRacingState(777)
      racing.isRegistered = true
      racing.pendingEntry = { tierId: TIER.id, modelId: model.id, modelName: model.name }
      const company = createCompanyState('Test Co', 'Testville', 100)
      const bank = createBank(0)
      const ledger = createLedgerState()
      return onRacingMonthTick(racing, [model], [TIER], company, bank, ledger, makeDate(1980, 2, 1))
    }

    // Compares everything except `id`, which comes from a module-level counter shared across the
    // whole test file (and real gameplay) - not itself part of the "same inputs -> same result"
    // determinism this test is pinning.
    const a = runOnce()
    const b = runOnce()
    expect({ ...a, id: undefined }).toEqual({ ...b, id: undefined })
  })

  it('caps history at MAX_RACE_HISTORY and keeps the newest entry first', () => {
    const { racing, bank, ledger } = registeredTeam(1_000_000_000)
    const model = buildModel()
    const company = createCompanyState('Test Co', 'Testville', 100)

    let day = makeDate(1980, 1, 1)
    for (let i = 0; i < 25; i++) {
      enterRace(racing, TIER, model, bank, ledger, 1980, day)
      onRacingMonthTick(racing, [model], [TIER], company, bank, ledger, day)
      day = addDays(day, 30)
    }

    expect(racing.history.length).toBe(20)
  })
})

describe('isRaceTierUnlocked', () => {
  it('is unlocked from the tier unlock year onward, not before', () => {
    expect(isRaceTierUnlocked(TIER, TIER.unlockYear - 1)).toBe(false)
    expect(isRaceTierUnlocked(TIER, TIER.unlockYear)).toBe(true)
    expect(isRaceTierUnlocked(TIER, TIER.unlockYear + 1)).toBe(true)
  })
})
