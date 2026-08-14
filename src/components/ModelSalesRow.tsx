import type { CarModel } from '../core/vehicles'
import { useT } from '../i18n/useT'
import { Button, Row } from './Primitives'

interface ModelSalesRowProps {
  model: CarModel
  onClick: () => void
}

/** One row of the Office Hub's "SALES" panel. Direct port of ModelSalesRowView.cs. */
export function ModelSalesRow({ model, onClick }: ModelSalesRowProps) {
  const { t, fmt } = useT()
  return (
    <Row gap={3} style={{ background: 'var(--color-panel-light)', borderRadius: 'var(--radius)', padding: '8px 12px' }}>
      <span style={{ flex: 1, fontWeight: 600 }}>{model.name}</span>
      <span style={{ color: 'var(--color-trim)' }}>{fmt.compact(model.lifetimeEarnings)}</span>
      <Button onClick={onClick} aria-label={t('common.viewModelSales', { modelName: model.name })}>
        ›
      </Button>
    </Row>
  )
}
