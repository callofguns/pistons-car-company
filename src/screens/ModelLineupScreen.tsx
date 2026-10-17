import { useEffect, useState } from 'react'
import { useUiStore } from '../store/useUiStore'
import { useGameStore } from '../store/useGameStore'
import { useActiveTutorialStep } from '../store/useTutorialStore'
import { grouped, plainCurrency } from '../core/numberFormat'
import { useT } from '../i18n/useT'
import { formatCategoryTag } from '../i18n/vehicles'
import { Banknote, Calendar, Car, ChartColumn, Factory, Star, Tag, Wrench } from 'lucide-react'
import { developmentProgress01, isInDevelopment } from '../core/development'
import { MeterBar } from '../components/MeterBar'
import { CarCarousel } from '../components/CarCarousel'
import { SpecRow } from '../components/SpecRow'
import { SpecSheet } from '../components/SpecSheet'
import { TutorialCard } from '../components/TutorialCard'
import { Button } from '../components/Primitives'
import { FactoryBackdrop } from '../art/FactoryBackdrop'
import styles from './screen.module.css'
import layout from './showroom.module.css'
import lineupStyles from './ModelLineupScreen.module.css'

/** The model browser in the showroom layout: spec sheet on the left, the car (with its carousel) in
 * the middle, sales figures on the right, and "CREATE RESTYLING" to spin up a new design pre-filled
 * from the current model. Only the side lists scroll. */
export function ModelLineupScreen() {
  const show = useUiStore((s) => s.show)
  const payload = useUiStore((s) => s.payload)
  useGameStore((s) => s.revision)
  const models = useGameStore((s) => s.world.vehicles.models)
  const beginRestyling = useGameStore((s) => s.beginRestyling)
  const { t, fmt, locale } = useT()

  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (typeof payload === 'string') {
      const i = models.findIndex((m) => m.id === payload)
      if (i >= 0) setIndex(i)
    } else {
      setIndex((i) => Math.min(i, Math.max(0, models.length - 1)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload])

  const tutorialStep = useActiveTutorialStep()

  if (models.length === 0) {
    return (
      <div className={styles.screen}>
        <span className={styles.empty}>{t('modelLineup.noModels')}</span>
      </div>
    )
  }

  const model = models[Math.min(index, models.length - 1)]
  const s = model.stats

  return (
    <div className={layout.page}>
      <FactoryBackdrop className={layout.backdrop} />

      <aside className={layout.side}>
        <div className={`${layout.sideHeader} ${styles.staticHeader}`}>
          <span>{t('carDesign.specifications')}</span>
        </div>
        <div className={layout.sideList}>
          <SpecSheet stats={s} engineLiters={model.engine.displacementLiters} />
        </div>
      </aside>

      <section className={`${layout.center} ${lineupStyles.center}`}>
        <span className={lineupStyles.name}>{model.name}</span>
        <span className={lineupStyles.tag}>{formatCategoryTag(model, locale)}</span>
        {isInDevelopment(model) && (
          <div className={lineupStyles.development}>
            <span>
              <Wrench size={13} />
              {t('development.daysLeft', { days: model.developmentDaysRemaining ?? 0 })}
            </span>
            <MeterBar value01={developmentProgress01(model)} />
          </div>
        )}
        <div className={lineupStyles.stage}>
          <CarCarousel
            fill
            model={model}
            indexOneBased={index + 1}
            total={models.length}
            onPrevious={() => setIndex((i) => Math.max(0, i - 1))}
            onNext={() => setIndex((i) => Math.min(models.length - 1, i + 1))}
          />
          {tutorialStep && (
            <div className={lineupStyles.tutorial}>
              <TutorialCard step={tutorialStep.step} onNext={tutorialStep.next} onSkip={tutorialStep.skip} />
            </div>
          )}
        </div>
        <Button
          variant="primary"
          className={lineupStyles.restyle}
          onClick={() => {
            beginRestyling(model.id)
            show('BodySelection')
          }}
        >
          {t('modelLineup.createRestyling')}
        </Button>
      </section>

      <aside className={layout.side}>
        <div className={`${layout.sideHeader} ${styles.staticHeader}`}>
          <span>{t('nav.models')}</span>
        </div>
        <div className={layout.sideList}>
          <SpecRow Icon={Star} label={t('modelLineup.labelRating')} value={String(s.rating)} />
          <SpecRow Icon={Car} label={t('modelLineup.labelCarsSold')} value={grouped(model.totalSold)} />
          <SpecRow Icon={Banknote} label={t('modelLineup.labelEarnings')} value={fmt.money(model.lifetimeEarnings)} />
          <SpecRow Icon={Calendar} label={t('modelLineup.labelYearOfIssue')} value={fmt.date(model.issueDate)} />
          <SpecRow Icon={Factory} label={t('modelLineup.labelCostPrice')} value={plainCurrency(model.unitCost)} />
          <SpecRow Icon={Tag} label={t('modelLineup.labelPrice')} value={plainCurrency(model.salePrice)} />
          <Button className={lineupStyles.statsButton} onClick={() => show('SalesStatistics', model.id)}>
            <ChartColumn size={16} />
            {t('screen.salesStatistics.title')}
          </Button>
        </div>
      </aside>
    </div>
  )
}
