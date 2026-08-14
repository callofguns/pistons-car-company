import type { RumorTemplateSet } from '../core/company'
import { RUMOR_TEMPLATES } from '../data/rumorTemplates'
import { translate } from './t'
import type { Locale } from './locale'

/** Assembles a per-locale RumorTemplateSet from the rumor.* catalog keys. Advisor names
 * (RUMOR_TEMPLATES.advisorNames) are proper nouns, shared across every locale unchanged - only
 * the phrase-bank sentences are translated. {person}/{model} placeholders are left un-substituted
 * here on purpose: they're resolved later by core/company.ts's own fill(), which does a plain
 * string .replace() independent of this module's interpolate() - exactly how the English source
 * data (data/rumorTemplates.ts) always worked. */
export function getRumorTemplates(locale: Locale): RumorTemplateSet {
  return {
    advisorNames: RUMOR_TEMPLATES.advisorNames,
    modelSoldWellTemplates: [
      translate(locale, 'rumor.soldWell.0'),
      translate(locale, 'rumor.soldWell.1'),
      translate(locale, 'rumor.soldWell.2'),
    ],
    modelStruggledTemplates: [translate(locale, 'rumor.struggled.0'), translate(locale, 'rumor.struggled.1')],
    researchTemplates: [translate(locale, 'rumor.research.0'), translate(locale, 'rumor.research.1')],
  }
}
