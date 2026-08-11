import type { CarModel } from '../core/vehicles'
import { compact } from '../core/numberFormat'
import { Button, Row } from './Primitives'

interface ModelSalesRowProps {
  model: CarModel
  onClick: () => void
}

/** One row of the Office Hub's "SALES" panel. Direct port of ModelSalesRowView.cs. */
export function ModelSalesRow({ model, onClick }: ModelSalesRowProps) {
  return (
    <Row gap={3} style={{ background: 'var(--color-panel-light)', borderRadius: 'var(--radius)', padding: '8px 12px' }}>
      <span style={{ flex: 1, fontWeight: 600 }}>{model.name}</span>
      <span style={{ color: 'var(--color-gold)' }}>{compact(model.lifetimeEarnings)}</span>
      <Button onClick={onClick} aria-label={`View ${model.name} sales`}>
        ›
      </Button>
    </Row>
  )
}
