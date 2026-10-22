import { Check, Cog, Presentation, RefreshCw, X } from 'lucide-react'
import { Banknote, CalendarDays, Coins, CircleDollarSign } from 'lucide-react'
import { CarArt } from '../../art/CarArt'
import { AssistantAvatar } from '../AssistantAvatar'
import { Button } from '../Primitives'
import { SliderCard } from './SliderCard'
import { useT } from '../../i18n/useT'
import { PRESENTATION } from '../../core/carTuning'
import { grouped } from '../../core/numberFormat'
import styles from './ProductionScreen.module.css'

interface ProductionScreenProps {
  name: string
  bodyId: string
  color: string
  convertible?: boolean
  circulation: number
  maxCirculation: number
  onCirculation: (value: number) => void
  auto: boolean
  onAuto: (auto: boolean) => void
  presentation: boolean
  onPresentation: (on: boolean) => void
  equipmentCost: number
  unitCost: number
  developmentDays: number
  error: boolean
  onStart: () => void
  tutorial?: React.ReactNode
}

/** The last step: how many cars to build first, whether to throw a launch presentation, and the
 * numbers that go with it. START CREATION begins development of the car. */
export function ProductionScreen(props: ProductionScreenProps) {
  const { t, fmt } = useT()
  const run = props.circulation * props.unitCost
  return (
    <div className={styles.screen}>
      {props.tutorial && <div className={styles.tutorial}>{props.tutorial}</div>}
      <section className={styles.left}>
        <h2 className={styles.name}>{props.name}</h2>
        <div className={styles.carStage}>
          <CarArt bodyId={props.bodyId} color={props.color} convertible={props.convertible} className={styles.car} />
          <div className={styles.conveyor} />
        </div>
        {props.error && <span className={styles.error}>{t('production.notEnoughCash')}</span>}
        <Button variant="primary" className={styles.start} onClick={props.onStart} data-tutorial-target="wizard-continue">
          <Cog size={18} />
          {t('production.start')}
        </Button>
      </section>

      <section className={styles.right}>
        <div className={styles.advisor}>
          <div className={styles.portrait}>
            <AssistantAvatar />
          </div>
          <div>
            <b>{t('setup.assistantName')}</b>
            <p>{t('production.advice')}</p>
          </div>
        </div>

        <div className={props.auto ? styles.dim : undefined}>
          <SliderCard
            label={t('production.circulation')}
            valueText={grouped(props.circulation)}
            value={props.circulation}
            min={0}
            max={Math.max(100, props.maxCirculation)}
            step={50}
            onChange={(value) => {
              props.onAuto(false)
              props.onCirculation(value)
            }}
          />
        </div>

        <button type="button" role="switch" aria-checked={props.auto} className={styles.toggleRow} onClick={() => props.onAuto(!props.auto)}>
          <RefreshCw size={16} />
          <span>{t('production.autoSelect')}</span>
          <span className={`${styles.box} ${props.auto ? styles.on : ''}`}>{props.auto ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}</span>
        </button>
        <button type="button" role="switch" aria-checked={props.presentation} className={styles.toggleRow} onClick={() => props.onPresentation(!props.presentation)}>
          <Presentation size={16} />
          <span>{t('production.presentation')}</span>
          <span className={styles.cost}>
            <Banknote size={13} />
            {fmt.money(PRESENTATION.cost)}
          </span>
          <span className={`${styles.box} ${props.presentation ? styles.on : ''}`}>{props.presentation ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}</span>
        </button>

        <div className={styles.tiles}>
          <div className={styles.tile}>
            <CircleDollarSign size={24} />
            <span>{t('production.equipmentCost')}</span>
            <b>
              <Banknote size={13} />
              {fmt.money(props.equipmentCost)}
            </b>
            <em>{t('production.paid')}</em>
          </div>
          <div className={styles.tile}>
            <Coins size={24} />
            <span>{t('production.runPrice')}</span>
            <b>
              <Banknote size={13} />
              {fmt.money(run)}
            </b>
          </div>
          <div className={styles.tile}>
            <CalendarDays size={24} />
            <span>{t('production.speed')}</span>
            <b>{t('production.days', { value: props.developmentDays })}</b>
          </div>
        </div>
      </section>
    </div>
  )
}
