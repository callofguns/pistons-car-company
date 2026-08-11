import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import styles from './primitives.module.css'

function cx(...classes: (string | false | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'gold' | 'ghost'
}

/** The one button component every screen uses - keeps every button in the app visually and behaviorally consistent while the game is still in its flat/placeholder visual phase. */
export function Button({ variant = 'secondary', className, children, ...rest }: ButtonProps) {
  const variantClass = variant === 'secondary' ? undefined : styles[variant]
  return (
    <button className={cx(styles.button, variantClass, className)} {...rest}>
      {children}
    </button>
  )
}

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  light?: boolean
}

export function Panel({ light, className, children, ...rest }: PanelProps) {
  return (
    <div className={cx(styles.panel, light && styles.panelLight, className)} {...rest}>
      {children}
    </div>
  )
}

interface FlexProps extends HTMLAttributes<HTMLDivElement> {
  gap?: 1 | 2 | 3 | 4
}

export function Row({ gap = 2, className, children, ...rest }: FlexProps) {
  return (
    <div className={cx(styles.row, styles[`gap${gap}`], className)} {...rest}>
      {children}
    </div>
  )
}

export function Column({ gap = 2, className, children, ...rest }: FlexProps) {
  return (
    <div className={cx(styles.column, styles[`gap${gap}`], className)} {...rest}>
      {children}
    </div>
  )
}

export function Heading({ children, className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cx(styles.heading, className)} {...rest}>
      {children}
    </h2>
  )
}

export function Spacer({ height = 8 }: { height?: number }) {
  return <div style={{ height }} />
}

export type { ReactNode }
