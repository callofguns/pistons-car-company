import { useState } from 'react'
import { useGameStore } from '../store/useGameStore'
import { CATALOG } from '../data/catalog'
import { nodesInCategory } from '../core/catalog'
import { getNodeState, getProgress01, currentMoneyCost, isResearched, type ResearchCategory } from '../core/research'
import { ResearchNodeCard } from '../components/ResearchNodeCard'
import { ProgressButton } from '../components/ProgressButton'
import styles from './screen.module.css'

const CATEGORIES: ResearchCategory[] = ['Engine', 'Bodies', 'Undercarriage', 'Appearance', 'Interior', 'Safety']

/** The tech tree: six category tabs on the left, each lighting up like a loading bar as that
 * category's research completes, and a grid of research cards for the selected category on the
 * right. */
export function ResearchScreen() {
  useGameStore((s) => s.revision)
  const research = useGameStore((s) => s.world.research)
  const currentYear = useGameStore((s) => s.world.time.currentDate.year)
  const startResearch = useGameStore((s) => s.startResearch)

  const [selected, setSelected] = useState<ResearchCategory>('Engine')

  const nodes = nodesInCategory(CATALOG, selected)

  return (
    <div className={styles.columnsPage}>
      <div className={`${styles.column} ${styles.columnNarrow}`}>
        {CATEGORIES.map((category) => {
          const categoryNodes = nodesInCategory(CATALOG, category)
          const researchedCount = categoryNodes.filter((n) => isResearched(research, n.id)).length
          const progress = categoryNodes.length === 0 ? 0 : researchedCount / categoryNodes.length
          return (
            <ProgressButton
              key={category}
              label={category}
              progress01={progress}
              active={category === selected}
              onClick={() => setSelected(category)}
            />
          )
        })}
      </div>

      <div className={styles.grid} style={{ flex: 1, alignContent: 'flex-start', overflowY: 'auto' }}>
        {nodes.map((node) => (
          <ResearchNodeCard
            key={node.id}
            node={node}
            state={getNodeState(research, node, currentYear)}
            progress01={getProgress01(research, node.id)}
            moneyCost={currentMoneyCost(research, node, currentYear)}
            onAction={() => startResearch(node.id)}
          />
        ))}
      </div>
    </div>
  )
}
