import type { NewsEntry } from '../core/news'
import type { useT } from './useT'
import type { MessageKey } from './keys'
import type { Formatters } from './format'

/** Resolves through the current locale now that researchNodes.ts has real i18n keys (PR 3) - the
 * News entry only ever stored the stable nodeId (see core/news.ts's save-data rule), so this
 * function is the only thing that needed to change once that landed; what's persisted didn't. */
function researchNodeName(nodeId: string, t: ReturnType<typeof useT>['t']): string {
  return t(`data.research.${nodeId}.name` as MessageKey)
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
      return t('news.researchCompleted', { tech: researchNodeName(String(entry.params.nodeId), t) })
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
