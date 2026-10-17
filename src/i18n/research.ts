import type { ResearchNodeDefinition } from '../core/research'
import { RESEARCH_NODES } from '../data/researchNodes'
import type { useT } from './useT'
import type { MessageKey } from './keys'

type T = ReturnType<typeof useT>['t']

/** A research card's display name: unlock cards use the body/engine/part's own name, stat
 * upgrades their data.research.<id>.name key. */
export function researchNodeName(node: ResearchNodeDefinition, t: T): string {
  switch (node.unlocks?.kind) {
    case 'body':
      return t(`data.body.${node.unlocks.id}.name` as MessageKey)
    case 'engine':
      return t(`data.enginePreset.${node.unlocks.id}.name` as MessageKey)
    case 'part':
      return node.displayName
    default:
      return t(`data.research.${node.id}.name` as MessageKey)
  }
}

/** Same, from a saved node id (News entries only store the id). */
export function researchNodeNameById(nodeId: string, t: T): string {
  const node = RESEARCH_NODES.find((n) => n.id === nodeId)
  return node ? researchNodeName(node, t) : nodeId
}
