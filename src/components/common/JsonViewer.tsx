import { formatJson } from '../../lib/json'

type JsonViewerProps = {
  value: unknown
}

export function JsonViewer({ value }: JsonViewerProps) {
  return <pre className="json-viewer">{formatJson(value)}</pre>
}
