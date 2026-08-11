import { Row } from './Primitives'

/** One row in the Company screen's Rumors feed. Direct port of RumorRowView.cs. */
export function RumorRow({ text }: { text: string }) {
  return (
    <Row gap={3} style={{ padding: '8px 0', borderBottom: '1px solid var(--color-panel-light)' }}>
      <span style={{ fontSize: '1.2rem' }}>🗣️</span>
      <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{text}</span>
    </Row>
  )
}
