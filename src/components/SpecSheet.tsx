import { Activity, Box, Cloud, Cog, Droplet, Flag, Gauge, ShieldCheck, Timer, Weight, Wrench, Zap } from 'lucide-react'
import type { CarPerformanceStats } from '../core/vehicles'
import { plainCurrency } from '../core/numberFormat'
import { useT } from '../i18n/useT'
import { SpecRow } from './SpecRow'

interface SpecSheetProps {
  stats: CarPerformanceStats
  engineLiters: number
}

/** The full technical spec list for a car (live design preview or a finished model). */
export function SpecSheet({ stats, engineLiters }: SpecSheetProps) {
  const { t } = useT()
  return (
    <>
      <SpecRow Icon={Zap} label={t('modelLineup.labelPower')} value={t('modelLineup.power', { value: Math.round(stats.powerHp) })} />
      <SpecRow Icon={Cog} label={t('modelLineup.labelTorque')} value={t('specs.torque', { value: Math.round(stats.torqueNm) })} />
      <SpecRow Icon={Activity} label={t('specs.peakTorqueAt')} value={t('specs.rpm', { value: Math.round(stats.torqueRpm) })} />
      <SpecRow Icon={Box} label={t('modelLineup.labelEngineVolume')} value={t('modelLineup.engineVolume', { value: engineLiters.toFixed(1) })} />
      <SpecRow
        Icon={Droplet}
        label={t('specs.fuelUse')}
        value={t('modelLineup.fuelConsumption', { value: stats.fuelConsumptionL100Km.toFixed(1) })}
      />
      <SpecRow
        Icon={ShieldCheck}
        label={t('modelLineup.labelReliability')}
        value={t('modelLineup.reliability', { value: Math.round(stats.reliabilityPercent) })}
      />
      <SpecRow Icon={Cloud} label={t('modelLineup.labelEmissions')} value={t('modelLineup.emissions', { value: Math.round(stats.emissionsGKm) })} />
      <SpecRow Icon={Wrench} label={t('modelLineup.labelRepairCost')} value={plainCurrency(stats.repairCost)} />
      <SpecRow Icon={Weight} label={t('modelLineup.labelWeight')} value={t('modelLineup.weight', { value: Math.round(stats.weightKg) })} />
      <SpecRow Icon={Gauge} label={t('modelLineup.labelMaxRpm')} value={`${Math.round(stats.maxRpm)}`} />
      <SpecRow Icon={Timer} label={t('modelLineup.labelZeroToHundred')} value={t('modelLineup.zeroToHundred', { value: stats.zeroToHundredSec.toFixed(1) })} />
      <SpecRow Icon={Flag} label={t('carDesign.topSpeed')} value={t('carDesign.kmh', { value: Math.round(stats.topSpeedKph) })} />
    </>
  )
}
