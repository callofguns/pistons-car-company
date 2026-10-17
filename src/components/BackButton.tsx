import { ArrowLeft } from 'lucide-react'
import { useUiStore } from '../store/useUiStore'
import { useT } from '../i18n/useT'
import { Button } from './Primitives'
import styles from './BackButton.module.css'

/** The pinned top-left back arrow for screens that run without the top bar (Saves, Company
 * Naming, News) - same look as the top bar's own back button. */
export function BackButton() {
  const back = useUiStore((s) => s.back)
  const { t } = useT()
  return (
    <Button className={styles.button} onClick={back} aria-label={t('common.back')}>
      <ArrowLeft size={22} strokeWidth={2.5} />
    </Button>
  )
}
