import { useState, type ComponentType } from 'react'
import { Armchair, Car, CircleDot, Cog, FlaskConical, Palette, ShieldCheck, type LucideProps } from 'lucide-react'
import { isInDevelopment } from '../core/development'
import { researchPointsBonus } from '../core/staff'
import { useGameStore } from '../store/useGameStore'
import { CATALOG } from '../data/catalog'
import { nodesInCategory } from '../core/catalog'
import { canStartResearch, getNodeState, getProgress01, currentMoneyCost, currentScienceCost, isResearched, type ResearchCategory } from '../core/research'
import { useT } from '../i18n/useT'
import { researchNodeName } from '../i18n/research'
import type { MessageKey } from '../i18n/keys'
import { ResearchNodeCard } from '../components/ResearchNodeCard'
import { ProgressButton } from '../components/ProgressButton'
import styles from './ResearchScreen.module.css'

const CATEGORIES: { id: ResearchCategory; labelKey: MessageKey; Icon: ComponentType<LucideProps> }[] = [
  { id: 'Engine', labelKey: 'data.researchCategory.Engine', Icon: Cog },
  { id: 'Bodies', labelKey: 'data.researchCategory.Bodies', Icon: Car },
  { id: 'Undercarriage', labelKey: 'data.researchCategory.Undercarriage', Icon: CircleDot },
  { id: 'Appearance', labelKey: 'data.researchCategory.Appearance', Icon: Palette },
  { id: 'Interior', labelKey: 'data.researchCategory.Interior', Icon: Armchair },
  { id: 'Safety', labelKey: 'data.researchCategory.Safety', Icon: ShieldCheck },
]

/** The tech tree on a blueprint: the six categories down the left (each with its own progress
 * bar), and the selected category's research cards in a grid on the right. */
export function ResearchScreen() {
  useGameStore((s) => s.revision)
  const research = useGameStore((s) => s.world.research)
  const currentYear = useGameStore((s) => s.world.time.currentDate.year)
  const startResearch = useGameStore((s) => s.startResearch)
  const models = useGameStore((s) => s.world.vehicles.models)
  const staff = useGameStore((s) => s.world.staff)
  const bank = useGameStore((s) => s.world.bank)
  const config = useGameStore((s) => s.config)
  const catalog = useGameStore((s) => s.catalog)
  const { t } = useT()

  const [selected, setSelected] = useState<ResearchCategory>('Engine')
  const nodes = nodesInCategory(CATALOG, selected)
  const SelectedIcon = CATEGORIES.find((c) => c.id === selected)!.Icon
  const nameOf = (id: string | null | undefined) => {
    const other = id ? catalog.researchNodes.find((n) => n.id === id) : undefined
    return other ? researchNodeName(other, t) : undefined
  }
  const developingCount = models.filter(isInDevelopment).length
  // Same rate world.ts's advanceOneDay grants on a development day.
  const pointsPerDay = Math.round(config.researchPointsPerDay + researchPointsBonus(staff, catalog.employeePerks))

  return (
    <div className={styles.page}>
      <nav className={styles.sidebar}>
        {CATEGORIES.map(({ id, labelKey, Icon }) => {
          const categoryNodes = nodesInCategory(CATALOG, id)
          const researchedCount = categoryNodes.filter((n) => isResearched(research, n.id)).length
          return (
            <ProgressButton
              key={id}
              label={t(labelKey)}
              icon={<Icon size={22} />}
              progress01={categoryNodes.length === 0 ? 0 : researchedCount / categoryNodes.length}
              active={id === selected}
              onClick={() => setSelected(id)}
            />
          )
        })}
      </nav>

      <div className={styles.blueprint}>
        <p className={`${styles.pointsNote} ${developingCount > 0 ? styles.pointsActive : ''}`}>
          <FlaskConical size={15} />
          {developingCount > 0
            ? t('research.pointsActive', { points: pointsPerDay, count: developingCount })
            : t('research.pointsIdle')}
        </p>
        <div className={styles.grid}>
          {nodes.map((node) => {
            const state = getNodeState(research, node, currentYear)
            // A card too far ahead shows its normal price, not today's (unbuyable) breakthrough one.
            const costYear = state === 'TooEarly' ? node.availableYear : currentYear
            return (
              <ResearchNodeCard
                key={node.id}
                node={node}
                icon={<SelectedIcon size={28} strokeWidth={1.6} />}
                state={state}
                progress01={getProgress01(research, node.id)}
                moneyCost={currentMoneyCost(node, costYear)}
                scienceCost={currentScienceCost(node, costYear)}
                requiresName={nameOf(node.prerequisiteId)}
                excludesNames={node.excludes?.map((id) => nameOf(id) ?? id)}
                affordable={canStartResearch(research, node, bank, currentYear)}
                onAction={() => startResearch(node.id)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
