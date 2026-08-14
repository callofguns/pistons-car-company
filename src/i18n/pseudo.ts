/**
 * Dev-only pseudo-locale, exposed as an extra option on the Language screen only when
 * import.meta.env.DEV (see useT.ts / LanguageScreen.tsx). Not a real locale - never added to
 * SUPPORTED_LOCALES, never shipped to a player.
 *
 * Wrapping every resolved English message in brackets and padding it ~40% longer reveals two
 * failure modes at once, which is the entire point of building this instead of a "grep for
 * hardcoded strings" test (which would be a false-positive machine against the app's many
 * legitimately-hardcoded non-UI strings - ids, CSS class names, etc.):
 *   - any string still hard-coded in JSX bypasses t() entirely, so it stays plain ASCII and
 *     unbracketed next to everything else that's wrapped - a missed migration, instantly visible.
 *   - any container that can't absorb the extra ~40% breaks - the real overflow risk translated
 *     ES/FR text carries, caught here without needing an actual French translation to trigger it.
 */
const ACCENT_MAP: Record<string, string> = {
  a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú',
  A: 'Á', E: 'É', I: 'Í', O: 'Ó', U: 'Ú',
}

function accentify(message: string): string {
  return message.replace(/[aeiouAEIOU]/g, (c) => ACCENT_MAP[c] ?? c)
}

const PAD_UNIT = 'ŧéšţıñğ'

export function pseudoize(message: string): string {
  const padLength = Math.ceil(message.length * 0.4)
  const pad = PAD_UNIT.repeat(Math.ceil(padLength / PAD_UNIT.length)).slice(0, padLength)
  return `⟦${accentify(message)} ${pad}⟧`
}
