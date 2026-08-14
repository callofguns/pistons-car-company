import type { MessageKey } from './keys'
import type { CarModel } from '../core/vehicles'
import { findClassificationTag } from '../data/classifications'
import { translate } from './t'
import type { Locale } from './locale'

/** Derives a model's category tag ("BUDGET + SPORT") at display time from classificationTagIds,
 * resolving each tag's labelKey through the current locale - the fix for a genuine pre-existing
 * bug: CarModel.categoryTag (see core/vehicles.ts's @deprecated doc comment) was an uppercased,
 * English-only string frozen at design time, so it could never show correctly in any other
 * language no matter what a translator did. Falls back to the legacy field only if
 * classificationTagIds is ever empty (shouldn't happen for any v3+ save - see save.ts's schema
 * version comment - but cheap insurance for anything that slips through). */
export function formatCategoryTag(model: CarModel, locale: Locale): string {
  if (model.classificationTagIds.length === 0) return model.categoryTag
  return model.classificationTagIds
    .map((id) => findClassificationTag(id))
    .filter((tag): tag is NonNullable<typeof tag> => tag !== undefined)
    .map((tag) => translate(locale, tag.labelKey).toUpperCase())
    .join(' + ')
}

/** CarClass ('Sedan'|'SUV'|'Sports'|'Coupe'|'Truck') is a type-level English token used two ways:
 * as a body's own display class (BodySelectionScreen), and as an ingredient in the generated
 * default model name (CarDesignScreen's generateDefaultName - a suggestion pre-filled into an
 * editable field, never retro-translated once accepted; see that file's doc comment on why). One
 * shared mapping so both call sites can't drift. */
export const CAR_CLASS_KEY: Record<string, MessageKey> = {
  Sedan: 'data.carClass.Sedan',
  SUV: 'data.carClass.SUV',
  Sports: 'data.carClass.Sports',
  Coupe: 'data.carClass.Coupe',
  Truck: 'data.carClass.Truck',
}
