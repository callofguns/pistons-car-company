/** The game ships in English only. The Locale type is kept (rather than deleting the t()/fmt
 * plumbing that takes it) so every call site stays unchanged if another language is ever added. */
export type Locale = 'en'

export const DEFAULT_LOCALE: Locale = 'en'
