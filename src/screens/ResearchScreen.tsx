import { useState, type ComponentType } from 'react'
import { Armchair, Car, CircleDot, Cog, Palette, ShieldCheck, type LucideProps } from 'lucide-react'
import { useGameStore } from '../store/useGameStore'
import { CATALOG } from '../data/catalog'
import { nodesInCategory } from '../core/catalog'
import { getNodeState, getProgress01, currentMoneyCost, isResearched, type ResearchCategory } from '../core/research'
import { useT } from '../i18n/useT'
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
  const { t } = useT()

  const [selected, setSelected] = useState<ResearchCategory>('Engine')
  const nodes = nodesInCategory(CATALOG, selected)
  const SelectedIcon = CATEGORIES.find((c) => c.id === selected)!.Icon

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
        <div className={styles.grid}>
          {nodes.map((node) => (
            <ResearchNodeCard
              key={node.id}
              node={node}
              icon={<SelectedIcon size={28} strokeWidth={1.6} />}
              state={getNodeState(research, node, currentYear)}
              progress01={getProgress01(research, node.id)}
              moneyCost={currentMoneyCost(research, node, currentYear)}
              onAction={() => startResearch(node.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
