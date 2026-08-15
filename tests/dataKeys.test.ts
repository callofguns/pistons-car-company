import { describe, expect, it } from 'vitest'
import { en } from '../src/i18n/locales/en'
import { BODIES } from '../src/data/bodies'
import { ENGINE_PRESETS } from '../src/data/enginePresets'
import { RESEARCH_NODES } from '../src/data/researchNodes'
import { DESIGN_STEPS } from '../src/data/designSteps'
import { RACE_TIERS } from '../src/data/raceTiers'
import type { MessageKey } from '../src/i18n/keys'

const catalogKeys = new Set(Object.keys(en))

function assertKeyExists(key: string) {
  expect(catalogKeys.has(key), `missing i18n key: ${key}`).toBe(true)
}

/**
 * Stands in for the compile-time safety an explicit MessageKey field would normally give (see
 * en.ts's module doc, and the doc comments on src/i18n/vehicles.ts / src/i18n/designSteps.ts) for
 * every data table using id-derived keys instead: bodies.ts, enginePresets.ts, researchNodes.ts,
 * designSteps.ts. Walks the REAL tables (not a hand-copied list), so a data file gaining/renaming
 * an id without a matching catalog key fails here immediately, in every locale that mirrors en's
 * key set (tests/i18n.test.ts already pins that mirroring).
 */
describe('id-derived i18n keys exist for every data table entry', () => {
  it('bodies.ts', () => {
    for (const body of BODIES) assertKeyExists(`data.body.${body.id}.name`)
  })

  it('enginePresets.ts', () => {
    for (const preset of ENGINE_PRESETS) assertKeyExists(`data.enginePreset.${preset.id}.name`)
  })

  it('researchNodes.ts', () => {
    for (const node of RESEARCH_NODES) assertKeyExists(`data.research.${node.id}.name`)
  })

  it('designSteps.ts - step title/breadcrumb', () => {
    for (const step of DESIGN_STEPS) {
      assertKeyExists(`data.designStep.${step.id}.title`)
      assertKeyExists(`data.designStep.${step.id}.breadcrumb`)
    }
  })

  it('designSteps.ts - slot labels', () => {
    for (const step of DESIGN_STEPS) {
      for (const slot of step.slots) assertKeyExists(`data.designSlot.${slot.id}.label`)
    }
  })

  it('raceTiers.ts', () => {
    for (const tier of RACE_TIERS) assertKeyExists(`data.raceTier.${tier.id}.name`)
  })

  it('designSteps.ts - option labels, and descriptions where present', () => {
    for (const step of DESIGN_STEPS) {
      for (const slot of step.slots) {
        for (const option of slot.options) {
          assertKeyExists(`data.designOption.${slot.id}.${option.id}.label`)
          if (option.description) assertKeyExists(`data.designOption.${slot.id}.${option.id}.description`)
        }
      }
    }
  })

  // The load-bearing one: researchNodes.ts's ids are slug(category)+slug(name) and are persisted
  // in saves as ResearchNodeSaveEntry.nodeId (see save.ts). A translator-adjacent edit to the
  // English `name` strings in that file's BY_CATEGORY table would silently change every future
  // node id and orphan every existing save's research progress - this pins the full id list
  // against a hardcoded array so that particular mistake fails loudly, independent of the i18n
  // catalog check above.
  it('researchNodes.ts ids stay exactly this list (persisted in saves - never rename)', () => {
    const expectedIds: MessageKey[] = [
      'data.research.engine-engine-material.name',
      'data.research.engine-cylinder-head-material.name',
      'data.research.engine-pistons.name',
      'data.research.engine-crankshaft.name',
      'data.research.engine-fuel-system.name',
      'data.research.bodies-aerodynamic-shell.name',
      'data.research.bodies-lightweight-chassis.name',
      'data.research.bodies-composite-panels.name',
      'data.research.bodies-reinforced-frame.name',
      'data.research.bodies-modular-platform.name',
      'data.research.undercarriage-suspension-tuning.name',
      'data.research.undercarriage-disc-brakes.name',
      'data.research.undercarriage-alloy-wheels.name',
      'data.research.undercarriage-independent-rear-suspension.name',
      'data.research.undercarriage-anti-roll-bars.name',
      'data.research.appearance-two-tone-paint.name',
      'data.research.appearance-chrome-trim.name',
      'data.research.appearance-led-headlights.name',
      'data.research.appearance-alloy-rims.name',
      'data.research.appearance-custom-livery.name',
      'data.research.interior-leather-seats.name',
      'data.research.interior-climate-control.name',
      'data.research.interior-sound-insulation.name',
      'data.research.interior-digital-dashboard.name',
      'data.research.interior-premium-audio.name',
      'data.research.safety-seatbelt-pretensioners.name',
      'data.research.safety-airbags.name',
      'data.research.safety-abs-braking.name',
      'data.research.safety-crumple-zones.name',
      'data.research.safety-stability-control.name',
    ]
    const actualIds = RESEARCH_NODES.map((n) => `data.research.${n.id}.name`)
    expect(actualIds).toEqual(expectedIds)
  })
})
