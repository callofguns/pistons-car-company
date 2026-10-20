import type { NewsEntry } from '../core/news'
import type { useT } from './useT'
import type { MessageKey } from './keys'
import type { Formatters } from './format'
import { researchNodeNameById } from './research'

function researchNodeName(nodeId: string, t: ReturnType<typeof useT>['t']): string {
  return researchNodeNameById(nodeId, t)
}

/** Same id-derived shape as researchNodeName above, for race tier names. */
function raceTierName(tierId: string, t: ReturnType<typeof useT>['t']): string {
  return t(`data.raceTier.${tierId}.name` as MessageKey)
}

/** Same id-derived shape as researchNodeName above, for HQ level names. */
function hqLevelName(level: number, t: ReturnType<typeof useT>['t']): string {
  return t(`data.hqLevel.${level}.name` as MessageKey)
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
    case 'ModelDevelopmentStarted':
      return t('news.modelDevelopmentStarted', { modelName: String(entry.params.modelName), days: Number(entry.params.days) })
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
    case 'RaceCompleted': {
      const vars = {
        modelName: String(entry.params.modelName),
        tier: raceTierName(String(entry.params.tierId), t),
        position: Number(entry.params.position),
        fieldSize: Number(entry.params.fieldSize),
      }
      const prize = Number(entry.params.prize)
      return prize > 0
        ? t('news.raceCompletedWithPrize', { ...vars, prize: fmt.compact(prize) })
        : t('news.raceCompletedNoPrize', vars)
    }
    case 'HQUpgraded':
      return t('news.hqUpgraded', { level: hqLevelName(Number(entry.params.level), t) })
    case 'HistoryEventStarted':
      return t('news.historyEventStarted', {
        name: t(`data.historyEvent.${entry.params.eventId}.name` as MessageKey),
        description: t(`data.historyEvent.${entry.params.eventId}.description` as MessageKey),
      })
    case 'RivalLaunch':
      return t('news.rivalLaunch', { rival: String(entry.params.rivalName), model: String(entry.params.modelName) })
    case 'AchievementUnlocked':
      return t('news.achievementUnlocked', {
        name: t(`data.achievement.${entry.params.achievementId}.name` as MessageKey),
        reward: fmt.money(Number(entry.params.reward)),
      })
    case 'HistoryEventEnded':
      return t('news.historyEventEnded', { name: t(`data.historyEvent.${entry.params.eventId}.name` as MessageKey) })
    default: {
      const exhaustive: never = entry.type
      return exhaustive
    }
  }
}
