import { useT } from '../i18n/useT'
import { Button, Row } from './Primitives'

interface SteppedSliderProps {
  value01: number
  onChange: (value01: number) => void
  displayText?: string
  step?: number
}

/** The minus/slider/plus control used for the Employees "Personnel expenses" budget. Direct port of SteppedSliderView.cs. */
export function SteppedSlider({ value01, onChange, displayText, step = 0.05 }: SteppedSliderProps) {
  const { t } = useT()
  const clamp = (v: number) => Math.min(1, Math.max(0, v))

  return (
    <Row gap={3}>
      <Button onClick={() => onChange(clamp(value01 - step))} aria-label={t('common.decrease')}>
        −
      </Button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value01}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        style={{ flex: 1, accentColor: 'var(--color-accent)' }}
      />
      <Button onClick={() => onChange(clamp(value01 + step))} aria-label={t('common.increase')}>
        +
      </Button>
      {displayText && <span style={{ minWidth: '4ch', textAlign: 'right' }}>{displayText}</span>}
    </Row>
  )
}
