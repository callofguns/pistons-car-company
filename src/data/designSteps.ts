import type { DesignStatKey } from '../core/designStats'
import type { Aspiration } from '../core/vehicles'

/**
 * One selectable option within a component slot (e.g. "Aluminum" under the "Body Material" slot
 * on the Safety step). Mirrors the reference's cycling option cards, including the locked-until-
 * a-future-year pattern already used by BodyStyleDefinition.unlockYear and ResearchNodeCard.
 */
/** What an engine-tuning option does to the engine itself (the Engine Tuning step). Percentages are
 * fractions (0.05 = +5%). Everything adds up across the chosen options. */
export interface EngineEffects {
  powerPct?: number
  torquePct?: number
  /** Points of reliability (percentage points) added or removed. */
  reliability?: number
  /** Change in fuel use: negative is thriftier. */
  fuelPct?: number
  emissionsPct?: number
  /** Extra rev limit in RPM. */
  maxRpm?: number
  /** Replaces the engine preset's aspiration (turbo, supercharger). */
  aspiration?: Aspiration
}

export interface ComponentOption {
  id: string
  label: string
  description?: string
  unlockYear: number
  costDelta: number
  weightDeltaKg: number
  effects: Partial<Record<DesignStatKey, number>>
  engine?: EngineEffects
}

/** One cycling picker within a step, e.g. "Body Material" or "Tire Supplier". */
export interface ComponentSlot {
  id: string
  label: string
  options: ComponentOption[]
}

/** A rating result screen can follow a step (only Safety declares one this pass). */
export type RatingCategory = 'Safety'

/** One generic, slot-based wizard step. Classification and Engine are handled separately in
 * CarDesignScreen since they aren't simple option-cycling (a tag grid and a whole-EngineSpec
 * carousel, respectively) - everything else is data-driven from this table. */
export interface DesignStepDefinition {
  id: string
  title: string
  breadcrumb: string
  slots: ComponentSlot[]
  /** Which design stats to show as bottom meters while this step is active. */
  meters: DesignStatKey[]
  ratingCategory?: RatingCategory
}

export const DESIGN_STEPS: DesignStepDefinition[] = [
  {
    id: 'Safety',
    title: 'Safety',
    breadcrumb: 'Car classification',
    meters: ['safety'],
    ratingCategory: 'Safety',
    slots: [
      {
        id: 'body-material',
        label: 'Body Material',
        options: [
          { id: 'steel', label: 'Steel', description: 'Cheap and simple.', unlockYear: 1950, costDelta: 0, weightDeltaKg: 0, effects: { safety: 20 } },
          { id: 'aluminum', label: 'Aluminum', description: 'Lighter, more expensive.', unlockYear: 1965, costDelta: 600, weightDeltaKg: -80, effects: { safety: 35 } },
          { id: 'high-strength-steel', label: 'High-Strength Steel', description: 'Better crash protection.', unlockYear: 1980, costDelta: 900, weightDeltaKg: -40, effects: { safety: 55 } },
          { id: 'composite', label: 'Composite Panels', description: 'Strong and light.', unlockYear: 1995, costDelta: 1800, weightDeltaKg: -150, effects: { safety: 70 } },
          { id: 'carbon-fiber', label: 'Carbon Fiber', description: 'Best-in-class, very costly.', unlockYear: 2010, costDelta: 4200, weightDeltaKg: -220, effects: { safety: 85 } },
        ],
      },
      {
        id: 'airbags',
        label: 'Airbags',
        options: [
          { id: 'none', label: 'None', unlockYear: 1950, costDelta: 0, weightDeltaKg: 0, effects: {} },
          { id: 'driver', label: 'Driver Airbag', unlockYear: 1970, costDelta: 150, weightDeltaKg: 3, effects: { safety: 10 } },
          { id: 'dual-front', label: 'Dual Front Airbags', unlockYear: 1985, costDelta: 320, weightDeltaKg: 5, effects: { safety: 20 } },
          { id: 'full-curtain', label: 'Full Curtain Airbags', unlockYear: 1998, costDelta: 650, weightDeltaKg: 8, effects: { safety: 35 } },
        ],
      },
      {
        id: 'passive-safety',
        label: 'Passive Safety',
        options: [
          { id: 'none', label: 'None', unlockYear: 1950, costDelta: 0, weightDeltaKg: 0, effects: {} },
          { id: 'crumple-zones', label: 'Crumple Zones', unlockYear: 1968, costDelta: 220, weightDeltaKg: 10, effects: { safety: 15 } },
          { id: 'reinforced-cage', label: 'Reinforced Cage', unlockYear: 1985, costDelta: 480, weightDeltaKg: 25, effects: { safety: 25 } },
          { id: 'advanced-structure', label: 'Advanced Structure', unlockYear: 2000, costDelta: 900, weightDeltaKg: 15, effects: { safety: 35 } },
        ],
      },
    ],
  },
  {
    id: 'EngineTuning',
    title: 'Engine Tuning',
    breadcrumb: 'Engine',
    meters: [],
    slots: [
      {
        id: 'bore-stroke',
        label: 'Bore & Stroke',
        options: [
          { id: 'balanced', label: 'Balanced', description: 'Bore and stroke the same: a sensible all-rounder.', unlockYear: 1950, costDelta: 0, weightDeltaKg: 0, effects: {} },
          { id: 'wide-bore', label: 'Wide Bore', description: 'Wider pistons rev higher and make more power, but wear faster.', unlockYear: 1950, costDelta: 300, weightDeltaKg: 0, effects: {}, engine: { powerPct: 0.05, maxRpm: 400, reliability: -2 } },
          { id: 'long-stroke', label: 'Long Stroke', description: 'Longer piston travel gives more pull at low revs and better fuel use.', unlockYear: 1950, costDelta: 300, weightDeltaKg: 0, effects: {}, engine: { powerPct: -0.02, torquePct: 0.08, fuelPct: -0.04, maxRpm: -400 } },
        ],
      },
      {
        id: 'forced-induction',
        label: 'Forced Induction',
        options: [
          { id: 'none', label: 'None', description: 'Uses whatever the engine has.', unlockYear: 1950, costDelta: 0, weightDeltaKg: 0, effects: {} },
          { id: 'turbocharger', label: 'Turbocharger', description: 'Exhaust-driven boost: much more power for a little less reliability.', unlockYear: 1975, costDelta: 1200, weightDeltaKg: 12, effects: {}, engine: { aspiration: 'Turbocharged' } },
          { id: 'supercharger', label: 'Supercharger', description: 'Belt-driven boost: instant response, but thirstier.', unlockYear: 1980, costDelta: 1000, weightDeltaKg: 15, effects: {}, engine: { aspiration: 'Supercharged', torquePct: 0.05, fuelPct: 0.05 } },
          { id: 'twin-turbo', label: 'Twin Turbo', description: 'Two turbochargers: serious power, serious cost.', unlockYear: 1995, costDelta: 2600, weightDeltaKg: 22, effects: {}, engine: { aspiration: 'Turbocharged', powerPct: 0.12, reliability: -2, fuelPct: 0.04 } },
        ],
      },
      {
        id: 'camshaft',
        label: 'Camshaft',
        options: [
          { id: 'standard', label: 'Standard', unlockYear: 1950, costDelta: 0, weightDeltaKg: 0, effects: {} },
          { id: 'sport-cam', label: 'Sport Cam', description: 'More power at high revs; slightly thirstier.', unlockYear: 1975, costDelta: 450, weightDeltaKg: 0, effects: {}, engine: { powerPct: 0.04, reliability: -1, fuelPct: 0.03 } },
          { id: 'racing-cam', label: 'Racing Cam', description: 'Big power and a high rev limit, with a rougher, less reliable engine.', unlockYear: 1990, costDelta: 1100, weightDeltaKg: 0, effects: {}, engine: { powerPct: 0.09, maxRpm: 500, reliability: -4, fuelPct: 0.08 } },
          { id: 'variable-valve', label: 'Variable Valve Timing', description: 'Power when you want it and thrift when you do not.', unlockYear: 1995, costDelta: 1300, weightDeltaKg: 3, effects: {}, engine: { powerPct: 0.06, fuelPct: -0.06, reliability: -1 } },
        ],
      },
      {
        id: 'cooling',
        label: 'Cooling',
        options: [
          { id: 'liquid', label: 'Liquid Cooled', description: 'The normal choice.', unlockYear: 1950, costDelta: 0, weightDeltaKg: 0, effects: {} },
          { id: 'air-cooled', label: 'Air Cooled', description: 'Cheaper and lighter, but runs hot.', unlockYear: 1950, costDelta: -150, weightDeltaKg: -15, effects: {}, engine: { reliability: -3 } },
          { id: 'performance-cooling', label: 'Performance Cooling', description: 'Keeps a hard-working engine healthy.', unlockYear: 1980, costDelta: 450, weightDeltaKg: 6, effects: {}, engine: { reliability: 3 } },
        ],
      },
      {
        id: 'exhaust',
        label: 'Exhaust',
        options: [
          { id: 'stock', label: 'Stock', unlockYear: 1950, costDelta: 0, weightDeltaKg: 0, effects: {} },
          { id: 'sport-exhaust', label: 'Sport Exhaust', description: 'A little more power and a lot more noise and emissions.', unlockYear: 1950, costDelta: 250, weightDeltaKg: -4, effects: {}, engine: { powerPct: 0.03, emissionsPct: 0.08 } },
          { id: 'catalytic', label: 'Catalytic Converter', description: 'Cuts emissions sharply, costing a little power.', unlockYear: 1975, costDelta: 300, weightDeltaKg: 8, effects: {}, engine: { powerPct: -0.02, emissionsPct: -0.25 } },
          { id: 'performance-headers', label: 'Performance Headers', description: 'Free-flowing exhaust: good power, dirty emissions.', unlockYear: 1985, costDelta: 600, weightDeltaKg: 2, effects: {}, engine: { powerPct: 0.05, emissionsPct: 0.12 } },
        ],
      },
    ],
  },
  {
    id: 'Transmission',
    title: 'Transmission',
    breadcrumb: 'Engine Tuning',
    meters: ['handling'],
    slots: [
      {
        id: 'gearbox-type',
        label: 'Gearbox',
        options: [
          { id: 'manual', label: 'Manual', unlockYear: 1950, costDelta: 0, weightDeltaKg: 0, effects: {} },
          { id: 'automatic', label: 'Automatic', unlockYear: 1965, costDelta: 650, weightDeltaKg: 20, effects: { handling: -5 } },
          { id: 'dual-clutch', label: 'Dual-Clutch', unlockYear: 1995, costDelta: 1400, weightDeltaKg: 15, effects: { handling: 10 } },
        ],
      },
      {
        id: 'drive-type',
        label: 'Drive Type',
        options: [
          { id: 'fwd', label: 'Front-Wheel Drive', unlockYear: 1950, costDelta: 0, weightDeltaKg: 0, effects: { handling: 5 } },
          { id: 'rwd', label: 'Rear-Wheel Drive', unlockYear: 1950, costDelta: 150, weightDeltaKg: 10, effects: { handling: 10 } },
          { id: 'awd', label: 'All-Wheel Drive', unlockYear: 1980, costDelta: 1200, weightDeltaKg: 60, effects: { handling: 20, offroad: 15 } },
        ],
      },
    ],
  },
  {
    id: 'Undercarriage',
    title: 'Undercarriage',
    breadcrumb: 'Transmission',
    meters: ['handling', 'offroad'],
    slots: [
      {
        id: 'suspension',
        label: 'Suspension',
        options: [
          { id: 'standard', label: 'Standard', unlockYear: 1950, costDelta: 0, weightDeltaKg: 0, effects: {} },
          { id: 'sport', label: 'Sport', unlockYear: 1975, costDelta: 500, weightDeltaKg: -10, effects: { handling: 15 } },
          { id: 'off-road', label: 'Off-Road', unlockYear: 1970, costDelta: 700, weightDeltaKg: 40, effects: { offroad: 25, handling: -5 } },
          { id: 'adaptive', label: 'Adaptive', unlockYear: 2000, costDelta: 1800, weightDeltaKg: 10, effects: { handling: 20, offroad: 10 } },
        ],
      },
      {
        id: 'brakes',
        label: 'Brakes',
        options: [
          { id: 'drum', label: 'Drum', unlockYear: 1950, costDelta: 0, weightDeltaKg: 0, effects: {} },
          { id: 'disc-front', label: 'Front Disc', unlockYear: 1965, costDelta: 300, weightDeltaKg: 5, effects: { handling: 8 } },
          { id: 'disc-all-round', label: 'All-Round Disc', unlockYear: 1980, costDelta: 600, weightDeltaKg: 10, effects: { handling: 15 } },
          { id: 'performance', label: 'Performance', unlockYear: 1995, costDelta: 1400, weightDeltaKg: 15, effects: { handling: 25 } },
        ],
      },
    ],
  },
  {
    id: 'Tires',
    title: 'Tires',
    breadcrumb: 'Undercarriage',
    meters: ['handling', 'offroad'],
    slots: [
      {
        id: 'tire-supplier',
        label: 'Tire Supplier',
        options: [
          { id: 'pireri', label: 'Pireri', description: 'Excellent handling and grip; weak offroad, pricey.', unlockYear: 1950, costDelta: 400, weightDeltaKg: 0, effects: { handling: 25, offroad: -15 } },
          { id: 'michelin', label: 'Michelin', description: 'Good handling and grip; weak offroad.', unlockYear: 1950, costDelta: 350, weightDeltaKg: 0, effects: { handling: 15, offroad: -10 } },
          { id: 'ridgestones', label: 'Ridgestones', description: 'Great offroad; weak handling and grip.', unlockYear: 1950, costDelta: 250, weightDeltaKg: 5, effects: { handling: -10, offroad: 20 } },
          { id: 'yoody-gear', label: 'Yoody Gear', description: 'Good handling and price; weak offroad and grip.', unlockYear: 1950, costDelta: 150, weightDeltaKg: 0, effects: { handling: 10, offroad: -5 } },
        ],
      },
    ],
  },
  {
    id: 'Appearance',
    title: 'Appearance',
    breadcrumb: 'Tires',
    meters: ['attractiveness'],
    slots: [
      {
        id: 'paint-finish',
        label: 'Paint Finish',
        options: [
          { id: 'standard', label: 'Standard', unlockYear: 1950, costDelta: 0, weightDeltaKg: 0, effects: { attractiveness: 5 } },
          { id: 'metallic', label: 'Metallic', unlockYear: 1960, costDelta: 300, weightDeltaKg: 0, effects: { attractiveness: 15 } },
          { id: 'pearlescent', label: 'Pearlescent', unlockYear: 1985, costDelta: 700, weightDeltaKg: 0, effects: { attractiveness: 25 } },
          { id: 'matte', label: 'Matte', unlockYear: 2000, costDelta: 900, weightDeltaKg: 0, effects: { attractiveness: 20 } },
        ],
      },
      {
        id: 'wheel-style',
        label: 'Wheels',
        options: [
          { id: 'steel', label: 'Steel', unlockYear: 1950, costDelta: 0, weightDeltaKg: 5, effects: {} },
          { id: 'alloy', label: 'Alloy', unlockYear: 1965, costDelta: 400, weightDeltaKg: -5, effects: { attractiveness: 15 } },
          { id: 'sport-alloy', label: 'Sport Alloy', unlockYear: 1985, costDelta: 800, weightDeltaKg: -8, effects: { attractiveness: 25 } },
          { id: 'custom-forged', label: 'Custom Forged', unlockYear: 2005, costDelta: 2200, weightDeltaKg: -15, effects: { attractiveness: 40 } },
        ],
      },
    ],
  },
  {
    id: 'Interior',
    title: 'Interior',
    breadcrumb: 'Appearance',
    meters: ['comfort', 'prestige'],
    slots: [
      {
        id: 'interior-material',
        label: 'Interior Material',
        options: [
          { id: 'basic-vinyl', label: 'Basic Vinyl', unlockYear: 1950, costDelta: 0, weightDeltaKg: 0, effects: { comfort: 10 } },
          { id: 'fabric', label: 'Fabric', unlockYear: 1950, costDelta: 150, weightDeltaKg: 3, effects: { comfort: 20 } },
          { id: 'leatherette', label: 'Leatherette', unlockYear: 1975, costDelta: 400, weightDeltaKg: 4, effects: { comfort: 30, prestige: 10 } },
          { id: 'leather', label: 'Leather', unlockYear: 1985, costDelta: 900, weightDeltaKg: 6, effects: { comfort: 45, prestige: 30 } },
          { id: 'premium-leather', label: 'Premium Leather', unlockYear: 2000, costDelta: 2000, weightDeltaKg: 8, effects: { comfort: 60, prestige: 55 } },
        ],
      },
      {
        id: 'features',
        label: 'Features',
        options: [
          { id: 'basic', label: 'Basic', unlockYear: 1950, costDelta: 0, weightDeltaKg: 0, effects: {} },
          { id: 'climate-control', label: 'Climate Control', unlockYear: 1975, costDelta: 350, weightDeltaKg: 4, effects: { comfort: 15 } },
          { id: 'premium-audio', label: 'Premium Audio', unlockYear: 1985, costDelta: 300, weightDeltaKg: 3, effects: { comfort: 10, prestige: 10 } },
          { id: 'full-luxury-suite', label: 'Full Luxury Suite', unlockYear: 2000, costDelta: 1600, weightDeltaKg: 10, effects: { comfort: 30, prestige: 35 } },
        ],
      },
    ],
  },
  {
    id: 'Aerodynamics',
    title: 'Aerodynamics',
    breadcrumb: 'Interior',
    meters: ['handling'],
    slots: [
      {
        id: 'aero-package',
        label: 'Aero Package',
        options: [
          { id: 'standard', label: 'Standard', unlockYear: 1950, costDelta: 0, weightDeltaKg: 0, effects: {} },
          { id: 'sport-kit', label: 'Sport Kit', unlockYear: 1975, costDelta: 500, weightDeltaKg: 10, effects: { handling: 15 } },
          { id: 'track-kit', label: 'Track Kit', unlockYear: 1995, costDelta: 1400, weightDeltaKg: 15, effects: { handling: 30, offroad: -10 } },
        ],
      },
    ],
  },
]

export function findDesignStep(id: string): DesignStepDefinition | undefined {
  return DESIGN_STEPS.find((s) => s.id === id)
}

export function defaultOptionId(slot: ComponentSlot): string {
  return slot.options[0].id
}
