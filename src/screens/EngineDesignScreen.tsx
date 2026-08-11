import { useState } from 'react'
import { useUiStore } from '../store/useUiStore'
import { useGameStore } from '../store/useGameStore'
import type { Aspiration, EngineSpec, FuelType } from '../core/vehicles'
import { plainCurrency } from '../core/numberFormat'
import { StatRow } from '../components/StatRow'
import { Button, Heading } from '../components/Primitives'
import styles from './screen.module.css'

const CYLINDER_OPTIONS = [3, 4, 5, 6, 8, 10, 12]
const ASPIRATIONS: Aspiration[] = ['NaturallyAspirated', 'Turbocharged', 'Supercharged']
const FUELS: FuelType[] = ['Petrol', 'Diesel', 'Electric']

/** Step 2 of the design wizard - tune displacement, cylinders, aspiration, and fuel, with a live spec-sheet preview. Not a distinct screen in the reference, but required by the brief's "performance attributes" requirement. */
export function EngineDesignScreen() {
  const show = useUiStore((s) => s.show)
  useGameStore((s) => s.revision)
  const session = useGameStore((s) => s.world.vehicles.currentSession)
  const setEngineSpec = useGameStore((s) => s.setEngineSpec)
  const previewCurrentStats = useGameStore((s) => s.previewCurrentStats)

  const [engine, setEngine] = useState<EngineSpec>(session?.engine ?? {
    displacementLiters: 2,
    cylinders: 4,
    aspiration: 'NaturallyAspirated',
    fuelType: 'Petrol',
    valveCount: 8,
  })

  if (!session) {
    return (
      <div className={styles.screen}>
        <span className={styles.empty}>No design in progress - go back and pick a body first.</span>
      </div>
    )
  }

  const apply = (next: EngineSpec) => {
    setEngine(next)
    setEngineSpec(next)
  }

  const stats = previewCurrentStats()

  return (
    <div className={styles.screen}>
      <Heading>Engine Design</Heading>

      <label>
        Displacement: {engine.displacementLiters.toFixed(1)} L
        <input
          type="range"
          min={1}
          max={8}
          step={0.1}
          value={engine.displacementLiters}
          onChange={(e) => apply({ ...engine, displacementLiters: Number(e.target.value) })}
          style={{ width: '100%', accentColor: 'var(--color-blue)' }}
        />
      </label>

      <label>
        Cylinders: {engine.cylinders}
        <input
          type="range"
          min={0}
          max={CYLINDER_OPTIONS.length - 1}
          step={1}
          value={CYLINDER_OPTIONS.indexOf(engine.cylinders)}
          onChange={(e) => apply({ ...engine, cylinders: CYLINDER_OPTIONS[Number(e.target.value)] })}
          style={{ width: '100%', accentColor: 'var(--color-blue)' }}
        />
      </label>

      <div style={{ display: 'flex', gap: 16 }}>
        <label style={{ flex: 1 }}>
          Aspiration
          <select
            value={engine.aspiration}
            onChange={(e) => apply({ ...engine, aspiration: e.target.value as Aspiration })}
            style={{ width: '100%', padding: 8 }}
          >
            {ASPIRATIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label style={{ flex: 1 }}>
          Fuel
          <select
            value={engine.fuelType}
            onChange={(e) => apply({ ...engine, fuelType: e.target.value as FuelType })}
            style={{ width: '100%', padding: 8 }}
          >
            {FUELS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
      </div>

      {stats && (
        <div>
          <StatRow label="Power" value={`${Math.round(stats.powerHp)} HP`} />
          <StatRow label="Torque" value={`${Math.round(stats.torqueNm)} NM @${Math.round(stats.torqueRpm)} RPM`} />
          <StatRow label="Fuel consumption" value={`${stats.fuelConsumptionL100Km.toFixed(1)} L/100KM`} />
          <StatRow label="Reliability" value={`${Math.round(stats.reliabilityPercent)}%`} />
          <StatRow label="Emissions" value={`${Math.round(stats.emissionsGKm)} G/KM`} />
          <StatRow label="Repair cost" value={plainCurrency(stats.repairCost)} />
          <StatRow label="Weight" value={`${Math.round(stats.weightKg)} KG`} />
          <StatRow label="Max RPM" value={`${Math.round(stats.maxRpm)}`} />
          <StatRow label="0-100" value={`${stats.zeroToHundredSec.toFixed(1)} SEC`} />
          <StatRow label="Top speed" value={`${Math.round(stats.topSpeedKph)} KM/H`} />
          <StatRow label="Rating" value={String(stats.rating)} />
        </div>
      )}

      <Button variant="primary" onClick={() => show('StylePricing')}>
        CONTINUE
      </Button>
    </div>
  )
}
