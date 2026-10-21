import { useState, type ComponentType } from 'react'
import {
  ArrowLeft, Briefcase, Check, ChevronLeft, ChevronRight, ChevronsRight, Coins, Dices, Globe, Lightbulb,
  Megaphone, MessageSquare, Pencil, ScrollText, Smartphone, Trophy, X, type LucideProps,
} from 'lucide-react'
import { useUiStore } from '../store/useUiStore'
import { useGameStore } from '../store/useGameStore'
import { useTutorialStore } from '../store/useTutorialStore'
import { useT } from '../i18n/useT'
import { listSlotInfo } from '../core/save'
import { DIFFICULTIES, type Difficulty } from '../core/difficulty'
import { DEFAULT_FOUNDER, hqRegion, suggestCompanyName, suggestLogo, type FounderProfile } from '../core/foundation'
import { GLOBAL_GOALS, HQ_REGIONS, LOGO_FORM_COUNT, LOGO_SYMBOL_COUNT, OCCUPATIONS, type GlobalGoalId, type OccupationId } from '../data/foundation'
import type { MessageKey } from '../i18n/keys'
import { AssistantAvatar } from '../components/AssistantAvatar'
import { CompanyLogo } from '../components/CompanyLogo'
import { Flag } from '../components/Flag'
import styles from './CompanyNamingScreen.module.css'

type Step = 'name' | 'logo' | 'hq' | 'goal' | 'occupation'
const STEPS: Step[] = ['name', 'logo', 'hq', 'goal', 'occupation']

const GOAL_ICONS: Record<GlobalGoalId, ComponentType<LucideProps>> = {
  fans: Globe,
  history: ScrollText,
  wealth: Coins,
  motorsport: Trophy,
}

const OCCUPATION_ICONS: Record<OccupationId, ComponentType<LucideProps>> = {
  marketer: Megaphone,
  publicFigure: Smartphone,
  businessman: Briefcase,
  innovator: Lightbulb,
}

/** The five setup screens that follow "+ NEW GAME" - name, logo, headquarters, global goal and
 * your background - with Ben Gross, the assistant, on the left, ending on an overview where the
 * choices are confirmed. Starting the game picks the first empty save slot; if every slot is
 * taken it hands off to the Save Slots screen so the player explicitly picks what gets replaced. */
export function CompanyNamingScreen() {
  const show = useUiStore((s) => s.show)
  const back = useUiStore((s) => s.back)
  const goHome = useUiStore((s) => s.goHome)
  const startNewGameInSlot = useGameStore((s) => s.startNewGameInSlot)
  const startTutorial = useTutorialStore((s) => s.start)
  const { t } = useT()

  const [stepIndex, setStepIndex] = useState(0)
  const [overview, setOverview] = useState(false)
  const [name, setName] = useState('')
  const [tutorial, setTutorial] = useState(true)
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [founder, setFounder] = useState<FounderProfile>(DEFAULT_FOUNDER)
  const [suggestions, setSuggestions] = useState(0)

  const step = STEPS[stepIndex]
  const trimmed = name.trim()
  const canConfirm = step !== 'name' || trimmed.length > 0

  const stepTitle = (s: Step) => t(`setup.title.${s}` as MessageKey)
  const parentLabel = stepIndex === 0 ? t('setup.mainMenu') : stepTitle(STEPS[stepIndex - 1])

  const goBack = () => {
    if (overview) setOverview(false)
    else if (stepIndex === 0) back()
    else setStepIndex(stepIndex - 1)
  }

  const confirmStep = () => {
    if (!canConfirm) return
    if (stepIndex < STEPS.length - 1) setStepIndex(stepIndex + 1)
    else setOverview(true)
  }

  const suggest = () => {
    const seed = Date.now() + suggestions * 7919
    setSuggestions(suggestions + 1)
    if (step === 'name') setName(suggestCompanyName(seed))
    else if (step === 'logo') setFounder({ ...founder, logo: suggestLogo(seed) })
  }

  const startGame = () => {
    // A truly empty slot first, then one holding an unplayable older-version save.
    const slots = listSlotInfo()
    let slotIndex = slots.findIndex((slot) => slot.kind === 'empty')
    if (slotIndex === -1) slotIndex = slots.findIndex((slot) => slot.kind === 'old')
    if (slotIndex === -1) {
      show('SaveSlots', { mode: 'new', pendingCompanyName: trimmed, difficulty, founder, tutorial })
      return
    }
    startNewGameInSlot(slotIndex, trimmed, difficulty, founder)
    if (tutorial) startTutorial()
    goHome('OfficeHub')
  }

  const setLogo = (patch: Partial<FounderProfile['logo']>) => setFounder({ ...founder, logo: { ...founder.logo, ...patch } })
  const region = hqRegion(founder.hqId)
  const Occupation = OCCUPATION_ICONS[founder.occupationId]
  const Goal = GOAL_ICONS[founder.goalId]

  return (
    <div className={styles.screen}>
      <header className={styles.topBar}>
        <button type="button" className={styles.backButton} onClick={goBack} aria-label={t('common.back')}>
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <span className={styles.crumbs}>
          <span className={styles.crumbParent}>{parentLabel}</span>
          <span className={styles.crumbTitle}>{stepTitle(step)}</span>
        </span>
      </header>

      <div className={styles.avatar}>
        <AssistantAvatar />
      </div>

      <main className={styles.content}>
        <div className={styles.speaker}>
          <ChevronLeft size={14} /> {t('setup.assistantName')}
        </div>

        {step === 'name' && (
          <>
            <h1 className={styles.heading}>{t('setup.name.heading')}</h1>
            <p className={styles.line}>
              <MessageSquare size={14} /> {t('setup.name.line')}
            </p>
            <div className={styles.nameRow}>
              <label className={styles.nameField}>
                <Pencil size={16} />
                <input
                  className={styles.nameInput}
                  value={name}
                  maxLength={32}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && confirmStep()}
                  placeholder={t('setup.name.placeholder')}
                  autoFocus
                />
              </label>
              <button type="button" className={styles.suggest} onClick={suggest}>
                <Dices size={16} /> {t('setup.suggest')}
              </button>
            </div>
            <div className={styles.difficulty} role="radiogroup" aria-label={t('companyNaming.difficulty')}>
              {DIFFICULTIES.map((level) => (
                <button
                  key={level}
                  type="button"
                  role="radio"
                  aria-checked={difficulty === level}
                  className={`${styles.pill} ${difficulty === level ? styles.pillSelected : ''}`}
                  onClick={() => setDifficulty(level)}
                >
                  <b>{t(`difficulty.${level}` as MessageKey)}</b>
                  <span>{t(`difficulty.${level}.description` as MessageKey)}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'logo' && (
          <>
            <h1 className={styles.heading}>{t('setup.logo.heading')}</h1>
            <p className={styles.line}>
              <MessageSquare size={14} /> {t('setup.logo.line')}
            </p>
            <div className={styles.logoArea}>
              <div className={styles.logoPreview}>
                <CompanyLogo logo={founder.logo} size={104} />
              </div>
              <div className={styles.logoControls}>
                <LogoRow
                  label={t('setup.logo.symbol')}
                  value={founder.logo.symbol}
                  count={LOGO_SYMBOL_COUNT}
                  hue={founder.logo.symbolHue}
                  onValue={(symbol) => setLogo({ symbol })}
                  onHue={(symbolHue) => setLogo({ symbolHue })}
                />
                <LogoRow
                  label={t('setup.logo.form')}
                  value={founder.logo.form}
                  count={LOGO_FORM_COUNT}
                  hue={founder.logo.formHue}
                  onValue={(form) => setLogo({ form })}
                  onHue={(formHue) => setLogo({ formHue })}
                />
              </div>
            </div>
          </>
        )}

        {step === 'hq' && (
          <>
            <h1 className={styles.heading}>{t('setup.hq.heading')}</h1>
            <p className={styles.line}>
              <MessageSquare size={14} /> {t('setup.hq.line')}
            </p>
            <div className={styles.hqScroller}>
              <div className={styles.hqRow}>
                {HQ_REGIONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`${styles.hqCard} ${founder.hqId === r.id ? styles.selected : ''}`}
                    onClick={() => setFounder({ ...founder, hqId: r.id })}
                  >
                    <span className={styles.flag}>
                      <Flag id={r.flag} />
                    </span>
                    <span className={styles.region}>{t(`data.hq.${r.id}.region` as MessageKey)}</span>
                    <span className={styles.city}>{r.city}</span>
                    <span className={styles.cardDesc}>{t(`data.hq.${r.id}.desc` as MessageKey)}</span>
                  </button>
                ))}
              </div>
              <span className={styles.scrollHint} aria-hidden="true">
                <ChevronsRight size={18} />
              </span>
            </div>
          </>
        )}

        {step === 'goal' && (
          <>
            <h1 className={styles.heading}>{t('setup.goal.heading')}</h1>
            <p className={styles.line}>
              <MessageSquare size={14} /> {t('setup.goal.line')}
            </p>
            <div className={styles.cardGrid}>
              {GLOBAL_GOALS.map((g) => {
                const Icon = GOAL_ICONS[g.id]
                return (
                  <button
                    key={g.id}
                    type="button"
                    className={`${styles.choiceCard} ${founder.goalId === g.id ? styles.selected : ''}`}
                    onClick={() => setFounder({ ...founder, goalId: g.id })}
                  >
                    <span className={styles.choiceName}>{t(`data.goal.${g.id}.name` as MessageKey)}</span>
                    <span className={styles.choiceDesc}>{t(`data.goal.${g.id}.desc` as MessageKey)}</span>
                    <Icon className={styles.choiceIcon} size={34} />
                  </button>
                )
              })}
            </div>
          </>
        )}

        {step === 'occupation' && (
          <>
            <h1 className={styles.heading}>{t('setup.occupation.heading')}</h1>
            <p className={styles.line}>{t('setup.occupation.line')}</p>
            <div className={styles.cardGrid}>
              {OCCUPATIONS.map((o) => {
                const Icon = OCCUPATION_ICONS[o.id]
                return (
                  <button
                    key={o.id}
                    type="button"
                    className={`${styles.choiceCard} ${founder.occupationId === o.id ? styles.selected : ''}`}
                    onClick={() => setFounder({ ...founder, occupationId: o.id })}
                  >
                    <span className={styles.choiceName}>{t(`data.occupation.${o.id}.name` as MessageKey)}</span>
                    <span className={styles.choiceDesc}>{t(`data.occupation.${o.id}.desc` as MessageKey)}</span>
                    <Icon className={styles.choiceIcon} size={34} />
                  </button>
                )
              })}
            </div>
          </>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.confirm} disabled={!canConfirm} onClick={confirmStep}>
            <Check size={18} /> {t('setup.confirm').replace('✓ ', '')}
          </button>
          {step === 'logo' && (
            <button type="button" className={styles.suggest} onClick={suggest}>
              <Dices size={16} /> {t('setup.suggest')}
            </button>
          )}
          {step === 'name' && (
            <label className={styles.toggle}>
              <input type="checkbox" checked={tutorial} onChange={(e) => setTutorial(e.target.checked)} />
              <span className={styles.toggleBox}>{tutorial && <Check size={14} strokeWidth={3} />}</span>
              {t('setup.name.tutorial')}
            </label>
          )}
        </div>
      </main>

      {overview && (
        <div className={styles.overview} role="dialog" aria-modal="true">
          <CompanyLogo logo={founder.logo} size={78} />
          <h2 className={styles.overviewName}>{trimmed}</h2>
          <div className={styles.overviewColumns}>
            <div className={styles.overviewColumn}>
              <Goal size={44} className={styles.overviewIcon} />
              <span className={styles.overviewLabel}>{t('setup.overview.goal')}</span>
              <b>{t(`data.goal.${founder.goalId}.name` as MessageKey)}</b>
              <span className={styles.overviewDesc}>{t(`data.goal.${founder.goalId}.desc` as MessageKey)}</span>
            </div>
            <div className={styles.overviewColumn}>
              {region && (
                <span className={styles.overviewFlag}>
                  <Flag id={region.flag} />
                </span>
              )}
              <span className={styles.overviewLabel}>{t('setup.overview.hq')}</span>
              <b>{region?.city.toUpperCase()}</b>
              <span className={styles.overviewDesc}>{t(`data.hq.${founder.hqId}.desc` as MessageKey)}</span>
            </div>
            <div className={styles.overviewColumn}>
              <Occupation size={44} className={styles.overviewIcon} />
              <span className={styles.overviewLabel}>{t('setup.overview.character')}</span>
              <b>{t(`data.occupation.${founder.occupationId}.name` as MessageKey)}</b>
              <span className={styles.overviewDesc}>{t(`data.occupation.${founder.occupationId}.desc` as MessageKey)}</span>
            </div>
          </div>
          <div className={styles.overviewActions}>
            <button type="button" className={styles.cancel} onClick={() => setOverview(false)}>
              <X size={16} /> {t('setup.cancel').replace('✕ ', '')}
            </button>
            <button type="button" className={styles.confirm} onClick={startGame}>
              <Check size={18} /> {t('setup.confirm').replace('✓ ', '')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** One row of the logo editor: previous/next arrows with a counter, and a rainbow colour slider. */
function LogoRow({
  label,
  value,
  count,
  hue,
  onValue,
  onHue,
}: {
  label: string
  value: number
  count: number
  hue: number
  onValue: (value: number) => void
  onHue: (hue: number) => void
}) {
  return (
    <div className={styles.logoRow}>
      <div className={styles.logoRowHead}>
        <span className={styles.logoRowLabel}>{label}</span>
        <button type="button" className={styles.arrow} onClick={() => onValue((value + count - 1) % count)} aria-label="Previous">
          <ChevronLeft size={16} strokeWidth={3} />
        </button>
        <span className={styles.counter}>
          {value + 1}/{count}
        </span>
        <button type="button" className={styles.arrow} onClick={() => onValue((value + 1) % count)} aria-label="Next">
          <ChevronRight size={16} strokeWidth={3} />
        </button>
      </div>
      <input
        type="range"
        className={styles.hue}
        min={0}
        max={360}
        value={hue}
        onChange={(e) => onHue(Number(e.target.value))}
        aria-label={label}
      />
    </div>
  )
}
