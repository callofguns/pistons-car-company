import type { ComponentType } from 'react'
import type { LucideProps } from 'lucide-react'
import styles from './SpecRow.module.css'

interface SpecRowProps {
  Icon: ComponentType<LucideProps>
  label: string
  value: string
}

/** One line of a showroom spec sheet: icon, label, value - like the reference's SPECIFICATIONS list. */
export function SpecRow({ Icon, label, value }: SpecRowProps) {
  return (
    <div className={styles.specRow}>
      <Icon size={18} className={styles.specIcon} />
      <span className={styles.specLabel}>{label}</span>
      <span className={styles.specValue}>{value}</span>
    </div>
  )
}
