import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { STORAGE_KEYS } from '../../../app/config/constants'

type MtoRow = {
  id: string
  description: string
  specification: string
  make: string
  quantity: string
  unit: string
  remarks: string
}

const emptyRow = (): MtoRow => ({
  id: crypto.randomUUID(),
  description: '',
  specification: '',
  make: '',
  quantity: '',
  unit: 'Nos',
  remarks: '',
})

const starterRows: MtoRow[] = [
  { id: 'sample-1', description: 'Pipe', specification: 'DN 600 mm', make: '', quantity: '100', unit: 'm', remarks: '' },
  { id: 'sample-2', description: 'Sluice Valve', specification: 'DN 600 mm', make: '', quantity: '2', unit: 'Nos', remarks: '' },
]

const csvCell = (value: string) => `"${value.replaceAll('"', '""')}"`

export function MTOGeneratorPage() {
  const [rows, setRows] = useState<MtoRow[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.mtoRows)
      return saved ? JSON.parse(saved) as MtoRow[] : starterRows
    } catch {
      return starterRows
    }
  })
  const [title, setTitle] = useState('Material Take-Off')
  const [project, setProject] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.mtoRows, JSON.stringify(rows))
  }, [rows])

  const totalRows = rows.length
  const filledRows = rows.filter((row) => row.description.trim()).length
  const updateRow = (id: string, key: keyof MtoRow, value: string) => {
    setRows((current) => current.map((row) => row.id === id ? { ...row, [key]: value } : row))
    setSavedMessage('')
  }
  const addRow = () => {
    setRows((current) => [...current, emptyRow()])
    setSavedMessage('')
  }
  const removeRow = (id: string) => {
    setRows((current) => current.filter((row) => row.id !== id))
  }
  const clearAll = () => {
    if (!window.confirm('Clear all MTO rows?')) return
    setRows([])
  }
  const loadSample = () => {
    setRows(starterRows.map((row) => ({ ...row, id: crypto.randomUUID() })))
    setSavedMessage('Sample MTO loaded.')
  }
  const downloadCsv = () => {
    const lines = [
      ['Sl. No.', 'Item Description', 'Specification / Size', 'Make', 'Quantity', 'Unit', 'Remarks'].map(csvCell).join(','),
      ...rows.map((row, index) => [String(index + 1), row.description, row.specification, row.make, row.quantity, row.unit, row.remarks].map(csvCell).join(',')),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'mto-sheet.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const summary = useMemo(() => `${filledRows} of ${totalRows} rows filled`, [filledRows, totalRows])

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Estimation</p>
          <h2>Material Take-Off Generator</h2>
          <p className="tool-description">Make a simple MTO sheet and take it to Excel, email or print.</p>
        </div>
        <div className="inline-actions print-hide">
          <Button type="button" variant="secondary" onClick={loadSample}>Load sample</Button>
          <Button type="button" variant="secondary" onClick={downloadCsv}>Download CSV</Button>
          <Button type="button" onClick={() => window.print()}>Print</Button>
        </div>
      </header>

      <Card className="panel">
        <div className="mto-heading-grid">
          <label className="field-group"><span>Title</span><input className="text-input" value={title} onChange={(event) => setTitle(event.target.value)} /></label>
          <label className="field-group"><span>Project / Work</span><input className="text-input" value={project} onChange={(event) => setProject(event.target.value)} placeholder="Project name" /></label>
          <div className="mto-summary"><strong>{summary}</strong><small>Rows are saved automatically in this browser.</small></div>
        </div>
      </Card>

      <Card className="panel mto-table-card">
        <div className="section-header print-hide">
          <div>
            <h3>Items</h3>
            <p className="tool-description">Edit any cell, add as many items as needed.</p>
          </div>
          <div className="inline-actions">
            <Button type="button" onClick={addRow}>+ Add item</Button>
            <Button type="button" variant="secondary" onClick={clearAll} disabled={!rows.length}>Clear</Button>
          </div>
        </div>

        <div className="mto-print-heading">
          <h1>{title}</h1>
          {project ? <p>{project}</p> : null}
        </div>

        <div className="table-wrap">
          <table className="mto-table">
            <thead>
              <tr>
                <th>Sl. No.</th>
                <th>Item Description</th>
                <th>Specification / Size</th>
                <th>Make</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Remarks</th>
                <th className="print-hide">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id}>
                  <td>{index + 1}</td>
                  <td><input aria-label={`Item ${index + 1} description`} className="table-input" value={row.description} onChange={(event) => updateRow(row.id, 'description', event.target.value)} /></td>
                  <td><input aria-label={`Item ${index + 1} specification`} className="table-input" value={row.specification} onChange={(event) => updateRow(row.id, 'specification', event.target.value)} /></td>
                  <td><input aria-label={`Item ${index + 1} make`} className="table-input" value={row.make} onChange={(event) => updateRow(row.id, 'make', event.target.value)} /></td>
                  <td><input aria-label={`Item ${index + 1} quantity`} className="table-input quantity-input" value={row.quantity} onChange={(event) => updateRow(row.id, 'quantity', event.target.value)} inputMode="decimal" /></td>
                  <td>
                    <select aria-label={`Item ${index + 1} unit`} className="table-input" value={row.unit} onChange={(event) => updateRow(row.id, 'unit', event.target.value)}>
                      <option>Nos</option><option>m</option><option>kg</option><option>ton</option><option>set</option><option>LS</option><option>m²</option><option>m³</option>
                    </select>
                  </td>
                  <td><input aria-label={`Item ${index + 1} remarks`} className="table-input" value={row.remarks} onChange={(event) => updateRow(row.id, 'remarks', event.target.value)} /></td>
                  <td className="print-hide"><button type="button" className="table-delete" onClick={() => removeRow(row.id)} aria-label={`Delete item ${index + 1}`}>Delete</button></td>
                </tr>
              ))}
              {!rows.length ? <tr><td colSpan={8} className="table-empty">No items yet. Click “+ Add item”.</td></tr> : null}
            </tbody>
          </table>
        </div>

        <div className="mto-footer print-hide">
          <span>{savedMessage}</span>
          <Button type="button" variant="secondary" onClick={() => { localStorage.setItem(STORAGE_KEYS.mtoRows, JSON.stringify(rows)); setSavedMessage('Saved.') }}>Save now</Button>
        </div>
      </Card>
    </div>
  )
}
