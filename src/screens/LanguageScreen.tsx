import { useUiStore } from '../store/useUiStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useT } from '../i18n/useT'
import { SUPPORTED_LOCALES, LOCALE_ENDONYMS, type Locale } from '../i18n/locale'
import { Button, Heading } from '../components/Primitives'
import styles from './screen.module.css'

/**
 * One full-width button per shipped locale (see i18n/locale.ts's SUPPORTED_LOCALES), labeled with
 * its own endonym - "Español" not the English word "Spanish" - never translated into whichever
 * locale is currently active, so this list renders byte-identical in every language and nothing
 * shifts position when the player switches. Applies immediately on tap; the whole app re-rendering
 * in the new language is the confirmation, so there's no separate confirm step.
 *
 * Runs full-screen like SaveSlots/CompanyNaming (see SCREENS_WITHOUT_HUD) - reachable from the
 * Main Menu, where useGameStore's world is a blank unsaved createNewWorld(), so the persistent
 * HUD would otherwise render stats for a company that doesn't exist.
 */
export function LanguageScreen() {
  const back = useUiStore((s) => s.back)
  const locale = useSettingsStore((s) => s.locale)
  const setLocale = useSettingsStore((s) => s.setLocale)
  const pseudoEnabled = useSettingsStore((s) => s.pseudoEnabled)
  const setPseudoEnabled = useSettingsStore((s) => s.setPseudoEnabled)
  const { t } = useT()

  return (
    <div className={`${styles.screen} ${styles.centered} ${styles.narrow}`} style={{ position: 'relative' }}>
      <Button
        style={{ position: 'absolute', top: 'var(--space-4)', left: 'var(--space-4)', width: 44, height: 44, padding: 0 }}
        onClick={back}
        aria-label={t('common.back')}
      >
        ‹
      </Button>

      <Heading>{t('language.screenTitle')}</Heading>

      {SUPPORTED_LOCALES.map((candidate: Locale) => (
        <Button
          key={candidate}
          variant={locale === candidate && !pseudoEnabled ? 'primary' : 'ghost'}
          style={{ width: '100%' }}
          onClick={() => {
            setPseudoEnabled(false)
            setLocale(candidate)
          }}
        >
          {locale === candidate && !pseudoEnabled ? '✓ ' : ''}
          {LOCALE_ENDONYMS[candidate]}
        </Button>
      ))}

      {/* Dev-only migration/overflow detector (see i18n/pseudo.ts) - never shown in production. */}
      {import.meta.env.DEV && (
        <Button
          variant={pseudoEnabled ? 'primary' : 'ghost'}
          style={{ width: '100%' }}
          onClick={() => setPseudoEnabled(!pseudoEnabled)}
        >
          {pseudoEnabled ? '✓ ' : ''}
          {t('language.pseudoOption')}
        </Button>
      )}
    </div>
  )
}
