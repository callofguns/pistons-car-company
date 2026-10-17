import { MessageCircle } from 'lucide-react'
import { Row } from './Primitives'

/** One row in the Company screen's Rumors feed. Direct port of RumorRowView.cs. */
export function RumorRow({ text }: { text: string }) {
  return (
    <Row gap={3} style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
      <MessageCircle size={18} color="var(--color-accent-hover)" style={{ flex: 'none' }} />
      <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{text}</span>
    </Row>
  )
}
