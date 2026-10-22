import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Warehouse } from 'lucide-react'
import { useGameStore } from '../store/useGameStore'
import { useActiveTutorialStep } from '../store/useTutorialStore'
import { TutorialCard } from '../components/TutorialCard'
import { lineLevel, LINE_LEVELS, maxLines, monthlyFactoryCosts, NEW_LINE_COST, type ProductionLine } from '../core/factory'
import { isInDevelopment } from '../core/development'
import { difficultySettings } from '../core/difficulty'
import type { CarModel } from '../core/vehicles'
import { grouped } from '../core/numberFormat'
import { useT } from '../i18n/useT'
import { CarArt, modelPaint } from '../art/CarArt'
import { Button } from '../components/Primitives'
import styles from './screen.module.css'
import factoryStyles from './FactoryScreen.module.css'

const ORDER_STEPS = [100, 500, 2000]

/** Production lines: pick which model each line builds, order cars, upgrade lines, build new
 * ones. The page stays still; only the line grid scrolls when there are many lines. */
export function FactoryScreen() {
  useGameStore((s) => s.revision)
  const world = useGameStore((s) => s.world)
  const buildLine = useGameStore((s) => s.buildLine)
  const { t, fmt } = useT()
  const [error, setError] = useState(false)
  const tutorialStep = useActiveTutorialStep()

  const { factory, vehicles, company } = world
  const max = maxLines(company.hqLevel)
  const stock = vehicles.models.reduce((sum, m) => sum + m.inventory, 0)
  const costs = monthlyFactoryCosts(factory, vehicles.models, difficultySettings(company.difficulty).costMultiplier)

  return (
    <div className={`${styles.screen} ${factoryStyles.page}`}>
      <div className={factoryStyles.summary}>
        <span>{t('factory.lines', { count: factory.lines.length, max })}</span>
        <span>{t('factory.stock', { count: grouped(stock) })}</span>
        <span>{t('factory.monthlyCosts', { upkeep: fmt.money(costs.upkeep), storage: fmt.money(costs.storage) })}</span>
      </div>

      {tutorialStep && (
        <div className={factoryStyles.tutorial}>
          <TutorialCard step={tutorialStep.step} onNext={tutorialStep.next} onSkip={tutorialStep.skip} />
        </div>
      )}

      <div className={`${styles.fill} ${factoryStyles.grid}`}>
        {factory.lines.map((line, i) => (
          <LineCard key={line.id} line={line} number={i + 1} models={vehicles.models} highlightOrder={i === 0 && tutorialStep?.step.targetId === 'factory-order'} />
        ))}

        <div className={`${factoryStyles.card} ${factoryStyles.newLine}`}>
          <Warehouse size={36} strokeWidth={1.4} />
          <span className={factoryStyles.title}>{t('factory.newLine')}</span>
          {factory.lines.length >= max ? (
            <span className={factoryStyles.hint}>{t('factory.lineLimit', { max })}</span>
          ) : (
            <>
              {error && <span className={factoryStyles.error}>{t('factory.notEnoughCash')}</span>}
              <Button variant="gold" onClick={() => setError(!buildLine())}>
                {t('factory.newLineCost', { cost: fmt.money(NEW_LINE_COST) })}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function LineCard({ line, number, models, highlightOrder }: { line: ProductionLine; number: number; models: CarModel[]; highlightOrder: boolean }) {
  const assignLineModel = useGameStore((s) => s.assignLineModel)
  const addLineOrder = useGameStore((s) => s.addLineOrder)
  const clearLineOrder = useGameStore((s) => s.clearLineOrder)
  const upgradeLine = useGameStore((s) => s.upgradeLine)
  const { t, fmt } = useT()
  const [error, setError] = useState(false)

  // Cycle through idle + every model, in lineup order.
  const choices: (string | null)[] = [null, ...models.map((m) => m.id)]
  const index = Math.max(0, choices.indexOf(line.modelId))
  const model = models.find((m) => m.id === line.modelId)
  const level = lineLevel(line.level)
  const next = line.level < LINE_LEVELS.length ? lineLevel(line.level + 1) : null
  // Running right now: a released model with cars still on order.
  const building = model !== undefined && !isInDevelopment(model) && line.orderRemaining > 0
  const step = (delta: number) => assignLineModel(line.id, choices[(index + delta + choices.length) % choices.length])

  return (
    <div className={factoryStyles.card}>
      <div className={factoryStyles.header}>
        <span className={factoryStyles.title}>{t('factory.line', { number })}</span>
        <span className={factoryStyles.level}>{t('factory.levelCapacity', { level: line.level, cars: level.carsPerDay })}</span>
      </div>

      <div className={factoryStyles.picker}>
        <button className={factoryStyles.arrow} onClick={() => step(-1)} aria-label={t('factory.previousModel')}>
          <ChevronLeft size={18} />
        </button>
        <div className={`${factoryStyles.modelBox} ${building ? factoryStyles.building : ''}`}>
          {model ? (
            <>
              <CarArt bodyId={model.bodyStyleId} color={modelPaint(model.id)} convertible={model.convertible} className={`${factoryStyles.car} ${building ? factoryStyles.carBuilding : ''}`} />
              <span className={factoryStyles.modelName}>{model.name}</span>
            </>
          ) : (
            <span className={factoryStyles.idle}>{t('factory.idle')}</span>
          )}
        </div>
        <button className={factoryStyles.arrow} onClick={() => step(1)} aria-label={t('factory.nextModel')}>
          <ChevronRight size={18} />
        </button>
      </div>

      <span className={factoryStyles.status}>
        {!model
          ? t('factory.idleHint')
          : isInDevelopment(model)
            ? t('factory.developingHint')
            : line.orderRemaining > 0
              ? `${t('factory.onOrder', { count: grouped(line.orderRemaining) })} · ${t('factory.daysLeft', { days: Math.ceil(line.orderRemaining / level.carsPerDay) })}`
              : t('factory.noOrder')}
      </span>

      <div className={factoryStyles.orders}>
        {ORDER_STEPS.map((cars) => (
          <Button
            key={cars}
            data-tutorial-target={cars === 500 ? 'factory-order' : undefined}
            className={`${factoryStyles.orderButton} ${highlightOrder && cars === 500 ? 'tutorial-target-highlight' : ''}`}
            disabled={!model} onClick={() => addLineOrder(line.id, cars)} aria-label={t('factory.addCars', { count: cars })}>
            <Plus size={12} strokeWidth={3} />
            {grouped(cars)}
          </Button>
        ))}
        <Button className={factoryStyles.orderButton} disabled={line.orderRemaining <= 0} onClick={() => clearLineOrder(line.id)}>
          {t('factory.clear')}
        </Button>
      </div>

      {error && <span className={factoryStyles.error}>{t('factory.notEnoughCash')}</span>}
      {next ? (
        <Button variant="primary" className={factoryStyles.upgrade} onClick={() => setError(!upgradeLine(line.id))}>
          {t('factory.upgrade', { cars: next.carsPerDay, cost: fmt.money(next.upgradeCost) })}
        </Button>
      ) : (
        <span className={factoryStyles.hint}>{t('factory.maxLevel')}</span>
      )}
    </div>
  )
}
