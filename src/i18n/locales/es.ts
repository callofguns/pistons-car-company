import type { LocaleCatalog } from '../keys'

/** Spanish. Typed against LocaleCatalog (en.ts's key set), so a missing or extra key here is a
 * compile error - see en.ts's doc comment for the full convention this file follows. */
export const es: LocaleCatalog = {
  'common.back': 'Atrás',
  'common.skipTutorial': 'Omitir tutorial',

  'nav.saves': 'Partidas',
  'nav.news': 'Noticias',
  'nav.language': 'Idioma',

  'language.screenTitle': 'Idioma',
  'language.pseudoOption': 'Pseudo (dev)',

  // Spanish 1 vs. other than 1 - same two-category shape as English, so these read like a direct
  // translation, but each locale's plural() call still goes through Intl.PluralRules rather than
  // a hand-rolled count===1 check (French needs a third category at large magnitudes).
  'stats.marketingDaysRemaining_one': '{count} día',
  'stats.marketingDaysRemaining_other': '{count} días',
  'stats.unitsSoldToday_one': '{count} unidad hoy',
  'stats.unitsSoldToday_other': '{count} unidades hoy',

  'news.screenTitle': 'Noticias',
  'news.empty': 'Nada que informar todavía.',
  'news.modelReleased': '{modelName} entra en producción a {price}.',
  'news.modelSoldOut': '{modelName} ha agotado su tirada de producción.',
  'news.researchCompleted': 'I+D completado: {tech}.',
  'news.loanTaken': 'Se solicitó un préstamo de {principal}.',
  'news.loanPaidOff': 'Se saldó un préstamo de {principal}.',
  'news.marketingCampaignStarted': 'Se lanzó una campaña de marketing para {modelName}.',
  'news.marketingCampaignEnded': 'La campaña de marketing de {modelName} ha terminado.',
  'news.monthlyReport': 'Informe mensual: {income} de ingresos, {expense} de gastos.',
  'news.bankruptcyWarning': 'Advertencia: quedan {days} días antes de la quiebra.',
  'news.racingTeamRegistered': '{teamName} ha sido inscrito para competir.',

  'rumor.soldWell.0': 'La opinión de {person} resultó decisiva esta vez.',
  'rumor.soldWell.1': '{model} podría marcar una nueva tendencia del mercado.',
  'rumor.soldWell.2': 'La opinión de {person} aumentó notablemente el interés por {model}.',
  'rumor.struggled.0': 'Dicen que el mercado no está dispuesto a pagar tanto por {model}.',
  'rumor.struggled.1': 'Las ventas de {model} han sido más lentas de lo esperado este mes.',
  'rumor.research.0': '¡Los ingenieros hicieron un gran trabajo! La nueva tecnología es muy prometedora.',
  'rumor.research.1': 'La empresa apuesta por la fiabilidad. Parece que las tecnologías más arriesgadas quedaron aparcadas.',

  'format.datePattern': '{day} {month} {year}',
  'format.percentPattern': '{value}%',
  'format.magnitude.K': 'K',
  'format.magnitude.M': 'M',
  'format.magnitude.B': 'MM',

  'month.1.abbr': 'ene.',
  'month.2.abbr': 'feb.',
  'month.3.abbr': 'mar.',
  'month.4.abbr': 'abr.',
  'month.5.abbr': 'may.',
  'month.6.abbr': 'jun.',
  'month.7.abbr': 'jul.',
  'month.8.abbr': 'ago.',
  'month.9.abbr': 'sep.',
  'month.10.abbr': 'oct.',
  'month.11.abbr': 'nov.',
  'month.12.abbr': 'dic.',
}
