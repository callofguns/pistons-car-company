import type { MessageKey } from '../i18n/keys'

/** What the right-hand column of a designer step shows: a step is split into parts, and the arrows
 * at the top right step through them. Rows name a part slot (data/designSteps.ts) or a slider. */
export type PartRow = { kind: 'slot'; slotId: string } | { kind: 'brake'; field: 'brakeFrontMm' | 'brakeRearMm' }

export interface PartDef {
  titleKey: MessageKey
  rows: PartRow[]
  /** Show the options as cards with pros and cons instead of a "1/3" picker (the tire suppliers). */
  cards?: boolean
}

const slot = (slotId: string): PartRow => ({ kind: 'slot', slotId })

export const STEP_PARTS: Record<string, PartDef[]> = {
  Transmission: [
    { titleKey: 'carDesign.part.transmission.0', rows: [slot('gearbox-type'), slot('gears'), slot('differential'), slot('drive-type')] },
    { titleKey: 'carDesign.part.transmission.1', rows: [slot('traction-aids')] },
  ],
  Undercarriage: [
    { titleKey: 'carDesign.part.undercarriage.0', rows: [slot('suspension')] },
    { titleKey: 'carDesign.part.undercarriage.1', rows: [slot('brakes'), slot('caliper')] },
    { titleKey: 'carDesign.part.undercarriage.2', rows: [{ kind: 'brake', field: 'brakeFrontMm' }, { kind: 'brake', field: 'brakeRearMm' }] },
  ],
  Tires: [
    { titleKey: 'carDesign.part.tires.0', rows: [slot('tire-supplier')], cards: true },
    { titleKey: 'carDesign.part.tires.1', rows: [slot('tire-type')] },
  ],
  Interior: [
    { titleKey: 'carDesign.part.interior.0', rows: [slot('interior-level'), slot('interior-material'), slot('seats')] },
    { titleKey: 'carDesign.part.interior.1', rows: [slot('features'), slot('entertainment'), slot('acoustics')] },
  ],
}

/** For each tire brand, how the card describes it. + good, - bad. */
export const TIRE_TRAITS: Record<string, { trait: 'handling' | 'offroad' | 'price' | 'grip'; level: 2 | 1 | -1 }[]> = {
  pireri: [{ trait: 'handling', level: 2 }, { trait: 'price', level: -1 }, { trait: 'offroad', level: -1 }, { trait: 'grip', level: 2 }],
  michelin: [{ trait: 'handling', level: 1 }, { trait: 'price', level: -1 }, { trait: 'offroad', level: -1 }, { trait: 'grip', level: 1 }],
  ridgestones: [{ trait: 'handling', level: -1 }, { trait: 'price', level: 1 }, { trait: 'offroad', level: 1 }, { trait: 'grip', level: -1 }],
  'yoody-gear': [{ trait: 'handling', level: 1 }, { trait: 'price', level: 1 }, { trait: 'offroad', level: -1 }, { trait: 'grip', level: -1 }],
}
