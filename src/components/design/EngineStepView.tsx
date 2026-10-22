import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Box,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Cloud,
  Cog,
  Droplet,
  Gauge,
  Settings2,
  ShieldCheck,
  Trash2,
  Weight,
  Wrench,
  Zap,
  Banknote,
} from 'lucide-react'
import { useGameStore } from '../../store/useGameStore'
import { partItem, unlockedByResearch } from '../../core/unlocks'
import {
  autoEngineName,
  buildLiters,
  buildSlot,
  clampBuild,
  computeEngineStats,
  defaultBuild,
  engineLimits,
  MIXTURE_RANGE,
  RPM_RANGE,
  BORE_RANGE,
  STROKE_RANGE,
  type EngineBuild,
  type EngineStats,
  type FuelGrade,
} from '../../core/engineBuilder'
import { nextEngineId } from '../../core/vehicleService'
import { plainCurrency } from '../../core/numberFormat'
import { findDesignStep, type ComponentOption, type ComponentSlot } from '../../data/designSteps'
import { translateDesignStep } from '../../i18n/designSteps'
import { useT } from '../../i18n/useT'
import type { MessageKey } from '../../i18n/keys'
import { EngineArt } from '../../art/EngineArt'
import { MeterBar } from '../MeterBar'
import { SpecRow } from '../SpecRow'
import { Button } from '../Primitives'
import { ComponentSlotCard } from './ComponentSlotCard'
import { SliderCard } from './SliderCard'
import { EngineGauges } from './EngineGauges'
import layout from '../../screens/showroom.module.css'
import styles from './EngineStepView.module.css'

type Row =
  | { kind: 'slot'; slotId: string }
  | { kind: 'cylinders' }
  | { kind: 'fuel' }
  | { kind: 'slider'; field: 'boreMm' | 'strokeMm' | 'rpmLimit' | 'fuelMixturePct' }

interface Section {
  id: 'block' | 'pistons' | 'fuel' | 'turbo' | 'exhaust' | 'finish'
  parts: Row[][]
}

/** The builder's sections (the tabs along the top) and, in each, the parts the right-hand arrows
 * step through. */
const SECTIONS: Section[] = [
  {
    id: 'block',
    parts: [
      [{ kind: 'slot', slotId: 'engine-type' }, { kind: 'cylinders' }, { kind: 'slot', slotId: 'engine-material' }, { kind: 'slot', slotId: 'head-material' }, { kind: 'slot', slotId: 'cooling' }],
      [{ kind: 'slider', field: 'boreMm' }, { kind: 'slider', field: 'strokeMm' }],
    ],
  },
  {
    id: 'pistons',
    parts: [
      [{ kind: 'slot', slotId: 'pistons' }, { kind: 'slot', slotId: 'conrods' }, { kind: 'slot', slotId: 'crankshaft' }],
      [{ kind: 'slot', slotId: 'camshaft' }, { kind: 'slot', slotId: 'valves' }],
    ],
  },
  {
    id: 'fuel',
    parts: [
      [{ kind: 'slot', slotId: 'fuel-system' }, { kind: 'fuel' }, { kind: 'slot', slotId: 'intake' }],
      [{ kind: 'slider', field: 'rpmLimit' }, { kind: 'slider', field: 'fuelMixturePct' }],
    ],
  },
  { id: 'turbo', parts: [[{ kind: 'slot', slotId: 'forced-induction' }, { kind: 'slot', slotId: 'turbo-setup' }, { kind: 'slot', slotId: 'turbo-preset' }]] },
  { id: 'exhaust', parts: [[{ kind: 'slot', slotId: 'exhaust' }, { kind: 'slot', slotId: 'manifold' }, { kind: 'slot', slotId: 'muffler' }]] },
  { id: 'finish', parts: [] },
]

const FINISH_INDEX = SECTIONS.length - 1

interface BuilderState {
  draft: EngineBuild
  section: number
  part: number
}

export interface BuilderHud {
  menuLabel: string
  title: string
  onBack: () => void
}

interface EngineStepViewProps {
  bayLiters: number
  /** The wizard's own tab strip, shown above the engine picker. */
  tabs: ReactNode
  canContinue: boolean
  onContinue: () => void
  tutorial?: ReactNode
  onBuilderHud: (hud: BuilderHud | null) => void
}

/** The Engine step of the car designer. First an engine picker over the company's engine library
 * (with CREATE ENGINE, edit and delete), and from CREATE ENGINE the engine builder: tabs along
 * the top for each section, arrows at the top right to step through the parts of a section,
 * CONTINUE for the next section, and a rev test on the last one. */
export function EngineStepView({ bayLiters, tabs, canContinue, onContinue, tutorial, onBuilderHud }: EngineStepViewProps) {
  const { t } = useT()
  const research = useGameStore((s) => s.world.research)
  const library = useGameStore((s) => s.world.vehicles.engines)
  const selected = useGameStore((s) => s.world.vehicles.currentSession?.engineBuild ?? null)
  const saveEngine = useGameStore((s) => s.saveEngine)
  const deleteEngine = useGameStore((s) => s.deleteEngine)
  const useEngine = useGameStore((s) => s.useEngine)

  const [builder, setBuilder] = useState<BuilderState | null>(null)
  const [specsOpen, setSpecsOpen] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isUnlocked = useMemo(() => unlockedByResearch(research), [research])
  const limits = useMemo(() => engineLimits(isUnlocked, bayLiters), [isUnlocked, bayLiters])
  const tech = research.modifiers

  // Slots with their English text swapped for the current language.
  const slots = useMemo(() => {
    const map = new Map<string, ComponentSlot>()
    for (const stepId of ['EngineBuild', 'EngineTuning']) {
      const step = findDesignStep(stepId)
      if (step) for (const slot of translateDesignStep(step, t).slots) map.set(slot.id, slot)
    }
    return map
  }, [t])

  const sectionLabel = (index: number) => t(`engineBuilder.section.${SECTIONS[index].id}` as MessageKey)

  useEffect(() => {
    if (!builder) {
      onBuilderHud(null)
      return
    }
    const { section } = builder
    onBuilderHud({
      menuLabel: section > 0 ? sectionLabel(section - 1) : t('carDesign.step.engine.title'),
      title: sectionLabel(section),
      onBack: () => setBuilder((b) => (b && b.section > 0 ? { ...b, section: b.section - 1, part: 0 } : null)),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builder?.section, !builder, t])
  useEffect(() => () => onBuilderHud(null), [onBuilderHud])

  const shownBuild = builder ? builder.draft : selected
  const stats: EngineStats | null = shownBuild ? computeEngineStats(shownBuild, tech) : null
  const liters = shownBuild ? buildLiters(shownBuild) : 0
  const fits = !shownBuild || liters <= bayLiters + 0.001

  const update = (patch: Partial<EngineBuild>) =>
    setBuilder((b) => (b ? { ...b, draft: clampBuild({ ...b.draft, ...patch }, limits) } : b))
  const setPart = (slotId: string, optionId: string) =>
    setBuilder((b) => (b ? { ...b, draft: clampBuild({ ...b.draft, parts: { ...b.draft.parts, [slotId]: optionId } }, limits) } : b))

  const startNew = () => {
    setConfirmDelete(false)
    setBuilder({ draft: clampBuild(defaultBuild(nextEngineId()), limits), section: 0, part: 0 })
  }
  const startEdit = () => {
    if (!selected) return
    setConfirmDelete(false)
    setBuilder({ draft: clampBuild({ ...selected, parts: { ...selected.parts } }, limits), section: 0, part: 0 })
  }
  const finish = () => {
    if (!builder) return
    const done = { ...builder.draft, name: autoEngineName(builder.draft) }
    saveEngine(done)
    useEngine(done)
    setBuilder(null)
  }
  const remove = () => {
    if (!selected) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    deleteEngine(selected.id)
    setConfirmDelete(false)
  }
  const step = (delta: number) => {
    if (library.length === 0) return
    setConfirmDelete(false)
    const current = selected ? library.findIndex((e) => e.id === selected.id) : -1
    const next = current < 0 ? (delta > 0 ? 0 : library.length - 1) : (current + delta + library.length) % library.length
    useEngine(library[next])
  }

  const specs = (
    <aside className={layout.side}>
      <button className={layout.sideHeader} onClick={() => setSpecsOpen((open) => !open)} aria-expanded={specsOpen}>
        {specsOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        <span>{t('engineBuilder.specifications')}</span>
        {specsOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
      </button>
      {specsOpen && (
        <div className={layout.sideList}>
          <SpecRow Icon={Zap} label={t('modelLineup.labelPower')} value={t('modelLineup.power', { value: stats ? Math.round(stats.powerHp) : 0 })} />
          <SpecRow Icon={Cog} label={t('modelLineup.labelTorque')} value={stats ? t('specs.torque', { value: Math.round(stats.torqueNm) }) + ` @${Math.round(stats.torqueRpm)}` : '0'} />
          <SpecRow Icon={Box} label={t('modelLineup.labelEngineVolume')} value={t('modelLineup.engineVolume', { value: liters.toFixed(1) })} />
          <SpecRow Icon={Droplet} label={t('engineBuilder.efficiency')} value={`${stats ? stats.efficiencyPercent : 0}%`} />
          <SpecRow Icon={ShieldCheck} label={t('modelLineup.labelReliability')} value={t('modelLineup.reliability', { value: stats ? Math.round(stats.reliabilityPercent) : 0 })} />
          <SpecRow Icon={Cloud} label={t('modelLineup.labelEmissions')} value={t('modelLineup.emissions', { value: stats ? Math.round(stats.emissionsGKm) : 0 })} />
          <SpecRow Icon={Wrench} label={t('modelLineup.labelRepairCost')} value={plainCurrency(stats ? stats.repairCost : 0)} />
          <SpecRow Icon={Weight} label={t('modelLineup.labelWeight')} value={t('modelLineup.weight', { value: stats ? Math.round(stats.weightKg) : 0 })} />
          <SpecRow Icon={Gauge} label={t('modelLineup.labelMaxRpm')} value={`${stats ? Math.round(stats.maxRpm) : 0}`} />
        </div>
      )}
    </aside>
  )

  const costPrice = (
    <div className={styles.costPrice}>
      <span className={styles.costLabel}>{t('carDesign.costPrice')}</span>
      <span className={styles.costValue}>
        <Banknote size={16} />
        {stats ? Math.round(stats.costPrice) : 0}
      </span>
    </div>
  )

  const capacity = (
    <div className={styles.capacity}>
      <span className={styles.capacityLabel}>{t('bodySelection.bodyCapacity')}</span>
      <div className={styles.capacityRow}>
        <span>{liters.toFixed(2)} L.</span>
        <MeterBar value01={bayLiters > 0 ? liters / bayLiters : 0} />
        <span>{bayLiters.toFixed(1)} L.</span>
      </div>
      {!fits && <span className={styles.warn}>{t('engineBuilder.doesNotFit')}</span>}
    </div>
  )

  // ---------------------------------------------------------------- the picker
  if (!builder) {
    const position = selected ? library.findIndex((e) => e.id === selected.id) + 1 : 0
    return (
      <div className={`${layout.page} ${styles.page}`}>
        {specs}
        <section className={`${layout.center} ${styles.center}`}>
          {tabs}
          {costPrice}
          <div className={styles.artStage}>
            <EngineArt build={selected} className={styles.art} />
            {tutorial && <div className={styles.tutorial}>{tutorial}</div>}
          </div>
          <div className={styles.selector}>
            <Button className={styles.arrowButton} onClick={() => step(-1)} disabled={library.length < 2 && !!selected} aria-label={t('engineBuilder.previousEngine')}>
              <ChevronLeft size={20} />
            </Button>
            <div className={styles.selectorText}>
              <span className={styles.counter}>
                {position} / {library.length}
              </span>
              <span className={styles.engineName}>{selected ? selected.name : library.length === 0 ? t('engineBuilder.noEngine') : '-'}</span>
            </div>
            <Button className={styles.arrowButton} onClick={() => step(1)} disabled={library.length < 2 && !!selected} aria-label={t('engineBuilder.nextEngine')}>
              <ChevronRight size={20} />
            </Button>
          </div>
          <div className={styles.buttons}>
            <Button className={styles.sideButton} onClick={startEdit} disabled={!selected} aria-label={t('engineBuilder.edit')}>
              <Wrench size={18} />
            </Button>
            <Button className={styles.createButton} onClick={startNew} data-tutorial-target="engine-create">
              <Settings2 size={18} />
              {t('engineBuilder.createEngine')}
            </Button>
            <Button
              className={`${styles.sideButton} ${confirmDelete ? styles.confirmDelete : ''}`}
              onClick={remove}
              disabled={!selected}
              aria-label={confirmDelete ? t('engineBuilder.deleteConfirm') : t('engineBuilder.delete')}
              title={confirmDelete ? t('engineBuilder.deleteConfirm') : t('engineBuilder.delete')}
            >
              <Trash2 size={18} />
            </Button>
          </div>
          <Button variant="primary" className={styles.continueButton} onClick={onContinue} disabled={!canContinue} data-tutorial-target="wizard-continue">
            {t('common.continue')}
          </Button>
        </section>
        <aside className={`${layout.side} ${styles.rightSide}`}>{capacity}</aside>
      </div>
    )
  }

  // ---------------------------------------------------------------- the builder
  const { draft, section, part } = builder
  const current = SECTIONS[section]
  const isFinish = section === FINISH_INDEX
  const electric = draft.fuel === 'electric'
  const rows = current.parts[Math.min(part, Math.max(0, current.parts.length - 1))] ?? []
  const partCount = current.parts.length

  const goSection = (index: number) => setBuilder({ ...builder, section: index, part: 0 })
  const goPart = (delta: number) => setBuilder({ ...builder, part: (part + delta + partCount) % partCount })

  const fuelSlot: ComponentSlot = {
    id: 'fuel-type',
    label: t('engineBuilder.row.fuelType'),
    options: FUEL_ORDER.map((id) => fuelOption(id, t(`engineBuilder.fuel.${id}` as MessageKey))),
  }
  const fuelUnlocked = (option: ComponentOption) => (option.id === 'diesel' ? limits.diesel : option.id === 'electric' ? limits.electric : true)
  const cylinderSlot: ComponentSlot = {
    id: 'cylinders',
    label: t('engineBuilder.row.cylinders'),
    options: limits.cylinderOptions.map((c) => fuelOption(String(c), String(c))),
  }

  const renderRow = (row: Row) => {
    if (row.kind === 'fuel') {
      return (
        <ComponentSlotCard key="fuel" slot={fuelSlot} selectedOptionId={draft.fuel} isOptionUnlocked={fuelUnlocked} onSelect={(id) => update({ fuel: id as FuelGrade })} />
      )
    }
    if (electric) return null
    if (row.kind === 'cylinders') {
      return (
        <ComponentSlotCard key="cylinders" slot={cylinderSlot} selectedOptionId={String(draft.cylinders)} isOptionUnlocked={() => true} onSelect={(id) => update({ cylinders: Number(id) })} />
      )
    }
    if (row.kind === 'slot') {
      const slot = slots.get(row.slotId) ?? buildSlot(row.slotId)
      if (!slot) return null
      return (
        <ComponentSlotCard
          key={row.slotId}
          slot={slot}
          selectedOptionId={draft.parts[row.slotId]}
          isOptionUnlocked={(option) => isUnlocked(partItem(row.slotId, option))}
          onSelect={(id) => setPart(row.slotId, id)}
        />
      )
    }
    const config = SLIDERS[row.field]
    return (
      <SliderCard
        key={row.field}
        label={t(config.labelKey)}
        valueText={config.format(draft[row.field])}
        value={draft[row.field]}
        min={config.min}
        max={config.max}
        step={config.step}
        onChange={(value) => update({ [row.field]: value } as Partial<EngineBuild>)}
      />
    )
  }

  const visibleTabs = [section - 1, section, section + 1, section + 2]

  return (
    <div className={`${layout.page} ${styles.page}`}>
      {specs}

      <section className={`${layout.center} ${styles.center}`}>
        <div className={styles.tabs4}>
          {visibleTabs.map((index, slot) => {
            if (index < 0 || index >= SECTIONS.length) return <span key={`gap-${slot}`} />
            const isCurrent = index === section
            return (
              <button
                key={index}
                type="button"
                className={`${styles.tab} ${isCurrent ? styles.tabActive : ''} ${slot === 3 ? styles.tabFaded : ''}`}
                onClick={() => goSection(index)}
              >
                {index < section && <Check size={13} className={styles.tabCheck} />}
                <span>{sectionLabel(index)}</span>
              </button>
            )
          })}
        </div>
        {costPrice}
        <div className={styles.artStage}>
          <EngineArt build={draft} className={styles.art} />
        </div>
        {capacity}
        <Button
          variant="primary"
          className={styles.continueButton}
          onClick={() => (isFinish ? finish() : goSection(section + 1))}
          disabled={isFinish && !fits}
        >
          {isFinish ? (
            <>
              <Cog size={18} />
              {t('engineBuilder.startCreation')}
            </>
          ) : (
            t('common.continue')
          )}
        </Button>
      </section>

      <aside className={layout.side}>
        {isFinish ? (
          <EngineGauges maxRpm={draft.rpmLimit} boosted={(draft.parts['forced-induction'] ?? 'none') !== 'none'} />
        ) : (
          <>
            <div className={layout.partsHeader}>
              {partCount > 1 && (
                <button className={layout.partsArrow} onClick={() => goPart(-1)} aria-label={t('engineBuilder.previousPart')}>
                  <ChevronLeft size={18} />
                </button>
              )}
              <span className={styles.partTitle}>{t(`engineBuilder.part.${current.id}.${part}` as MessageKey)}</span>
              {partCount > 1 && (
                <button className={layout.partsArrow} onClick={() => goPart(1)} aria-label={t('engineBuilder.nextPart')}>
                  <ChevronRight size={18} />
                </button>
              )}
            </div>
            {partCount > 1 && (
              <div className={styles.pager} aria-hidden="true">
                {current.parts.map((_, i) => (
                  <span key={i} className={`${styles.dash} ${i === part ? styles.dashActive : ''}`} />
                ))}
              </div>
            )}
            <div className={layout.sideList}>
              {rows.map(renderRow)}
              {electric && <p className={styles.note}>{t('engineBuilder.electricNote')}</p>}
            </div>
          </>
        )}
      </aside>
    </div>
  )
}

const FUEL_ORDER: FuelGrade[] = ['regular', 'premium', 'diesel', 'electric']

/** A plain option for the row cyclers that are not part slots (fuel type, cylinder count). */
function fuelOption(id: string, label: string): ComponentOption {
  return { id, label, unlockYear: 1950, costDelta: 0, weightDeltaKg: 0, effects: {} }
}

const SLIDERS: Record<
  'boreMm' | 'strokeMm' | 'rpmLimit' | 'fuelMixturePct',
  { labelKey: MessageKey; min: number; max: number; step: number; format: (value: number) => string }
> = {
  boreMm: { labelKey: 'engineBuilder.slider.bore', min: BORE_RANGE.min, max: BORE_RANGE.max, step: 1, format: (v) => String(v) },
  strokeMm: { labelKey: 'engineBuilder.slider.stroke', min: STROKE_RANGE.min, max: STROKE_RANGE.max, step: 1, format: (v) => String(v) },
  rpmLimit: { labelKey: 'engineBuilder.slider.rpm', min: RPM_RANGE.min, max: RPM_RANGE.max, step: RPM_RANGE.step, format: (v) => `${v} RPM` },
  fuelMixturePct: { labelKey: 'engineBuilder.slider.mixture', min: MIXTURE_RANGE.min, max: MIXTURE_RANGE.max, step: 1, format: (v) => `${v}%` },
}

