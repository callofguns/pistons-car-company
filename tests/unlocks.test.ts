import { describe, expect, it } from 'vitest'
import { createResearchState, getNodeState, currentMoneyCost, startResearch, onResearchDayTick } from '../src/core/research'
import { bodyItem, partItem, unlockNodeId, unlockedByResearch } from '../src/core/unlocks'
import { RESEARCH_NODES } from '../src/data/researchNodes'
import { BODIES } from '../src/data/bodies'
import { createBank } from '../src/core/economy'
import { createLedgerState } from '../src/core/ledger'
import { makeDate } from '../src/core/gameDate'
import { beginNewDesign, createVehicleState, selectBody } from '../src/core/vehicleService'

const node = (id: string) => RESEARCH_NODES.find((n) => n.id === id)!

describe('research unlocks parts', () => {
  it('parts from before the game starts are free, newer ones need research', () => {
    const isUnlocked = unlockedByResearch(createResearchState(0))
    expect(isUnlocked(partItem('airbags', { id: 'driver', unlockYear: 1970 }))).toBe(true)
    expect(isUnlocked(partItem('airbags', { id: 'dual-front', unlockYear: 1985 }))).toBe(false)
  })

  it('every post-1970 body has a research card, and finishing it unlocks the body', () => {
    const roadster = BODIES.find((b) => b.id === 'roadster')!
    const research = createResearchState(10_000)
    const card = node(unlockNodeId(bodyItem(roadster)))
    expect(card.unlocks).toEqual(bodyItem(roadster))

    const bank = createBank(1_000_000_000)
    expect(startResearch(research, card, bank, createLedgerState(), 1972, makeDate(1972, 1, 1))).toBe(true)
    for (let day = 0; day < card.durationDays; day++) onResearchDayTick(research, RESEARCH_NODES, 0)
    expect(unlockedByResearch(research)(bodyItem(roadster))).toBe(true)
  })

  it('a locked body cannot be picked for a new car', () => {
    const vehicles = createVehicleState()
    beginNewDesign(vehicles)
    const roadster = BODIES.find((b) => b.id === 'roadster')!
    const research = createResearchState(0)
    expect(selectBody(vehicles, roadster, createBank(1e9), createLedgerState(), unlockedByResearch(research), makeDate(1980, 1, 1))).toBe(false)
  })

  it('later parts in a slot need the earlier part researched first', () => {
    const research = createResearchState(0)
    const curtain = node(unlockNodeId(partItem('airbags', { id: 'full-curtain', unlockYear: 1998 })))
    expect(getNodeState(research, curtain, 2000)).toBe('Locked')
  })

  it('breakthroughs are limited to 8 years early and cost more the earlier they are', () => {
    const research = createResearchState(0)
    const dualFront = node(unlockNodeId(partItem('airbags', { id: 'dual-front', unlockYear: 1985 })))
    expect(getNodeState(research, dualFront, 1970)).toBe('TooEarly')
    expect(getNodeState(research, dualFront, 1977)).toBe('AvailableBreakthrough')
    expect(getNodeState(research, dualFront, 1985)).toBe('AvailableNormal')
    expect(currentMoneyCost(dualFront, 1977)).toBeGreaterThan(currentMoneyCost(dualFront, 1981))
    expect(currentMoneyCost(dualFront, 1981)).toBeGreaterThan(currentMoneyCost(dualFront, 1985))
  })
})
