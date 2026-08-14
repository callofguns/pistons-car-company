import type { NewsEntry } from '../core/news'
import { CATALOG } from '../data/catalog'
import type { useT } from './useT'
import type { Formatters } from './format'

/** Not yet migrated to i18n (that's PR 3's researchNodes.ts work) - displayName is still plain
 * English catalog data for now, so this returns whatever language the catalog itself is written
 * in regardless of the player's chosen locale. Becomes a
 * `t(\`data.research.${nodeId}.name\`)` lookup once PR 3 lands; the News entry only ever stores
 * the stable nodeId (see core/news.ts's save-data rule), so nothing here needs to change about
 * what's persisted when that happens - only this resolution function. */
function researchNodeName(nodeId: string): string {
  return CATALOG.researchNodes.find((n) => n.id === nodeId)?.displayName ?? nodeId
}

/** Not a hook - takes the `t`/`fmt` a component already obtained from its own single top-level
 * useT() call, rather than being one itself. NewsScreen calls this once per entry inside a
 * render-time .map(), and calling a hook per list item there would violate React's rules of hooks
 * the moment the list's length changes (which it does, constantly, as news arrives).
 *
 * The exhaustive switch + `never` default is what makes forgetting to add a message for a new
 * NewsEventType a compile error instead of a silent blank headline. */
export function renderNewsHeadline(entry: NewsEntry, t: ReturnType<typeof useT>['t'], fmt: Formatters): string {
  switch (entry.type) {
    case 'ModelReleased':
      return t('news.modelReleased', {
        modelName: String(entry.params.modelName),
        price: fmt.compact(Number(entry.params.price)),
      })
    case 'ModelSoldOut':
      return t('news.modelSoldOut', { modelName: String(entry.params.modelName) })
    case 'ResearchCompleted':
      return t('news.researchCompleted', { tech: researchNodeName(String(entry.params.nodeId)) })
    case 'LoanTaken':
      return t('news.loanTaken', { principal: fmt.compact(Number(entry.params.principal)) })
    case 'LoanPaidOff':
      return t('news.loanPaidOff', { principal: fmt.compact(Number(entry.params.principal)) })
    case 'MarketingCampaignStarted':
      return t('news.marketingCampaignStarted', { modelName: String(entry.params.modelName) })
    case 'MarketingCampaignEnded':
      return t('news.marketingCampaignEnded', { modelName: String(entry.params.modelName) })
    case 'MonthlyReport':
      return t('news.monthlyReport', {
        income: fmt.compact(Number(entry.params.income)),
        expense: fmt.compact(Number(entry.params.expense)),
      })
    case 'BankruptcyWarning':
      return t('news.bankruptcyWarning', { days: Number(entry.params.daysRemaining) })
    case 'RacingTeamRegistered':
      return t('news.racingTeamRegistered', { teamName: String(entry.params.teamName) })
    default: {
      const exhaustive: never = entry.type
      return exhaustive
    }
  }
}
