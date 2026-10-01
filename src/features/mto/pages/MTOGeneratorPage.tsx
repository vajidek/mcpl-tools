import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { ROUTE_PATHS, STORAGE_KEYS } from '../../../app/config/constants'

type MtoRow = {
  id: string
  description: string
  specification: string
  make: string
  quantity: string
  unit: string
  imageRef: string
}

const units = ['Nos', 'm', 'kg', 'ton', 'set', 'LS', 'm²', 'm³', 'Ltr', 'MT', 'Pair', 'Box']

const materials = [
  ['Pipe', 'Piping', ['m', 'Nos'], ['DN 100', 'DN 150', 'DN 300', 'DN 600', 'DN 1200']],
  ['Sluice Valve', 'Valves', ['Nos'], ['DN 100', 'DN 150', 'DN 300', 'DN 600', 'DN 1200']],
  ['Butterfly Valve', 'Valves', ['Nos'], ['DN 100', 'DN 150', 'DN 300', 'DN 600']],
  ['Dismantling Joint', 'Piping', ['Nos'], ['DN 100', 'DN 150', 'DN 300', 'DN 600']],
  ['Gasket', 'Piping', ['Nos', 'set'], ['DN 100', 'DN 150', 'DN 300', 'DN 600']],
  ['Hex Bolt', 'Fasteners', ['Nos'], ['M16 x 75 mm', 'M20 x 100 mm', 'M24 x 120 mm']],
  ['Nut', 'Fasteners', ['Nos'], ['M16', 'M20', 'M24']],
  ['Washer', 'Fasteners', ['Nos'], ['M16', 'M20', 'M24']],
  ['Pump', 'Mechanical', ['Nos', 'set'], ['As per approved specification']],
  ['Cable', 'Electrical', ['m'], ['1.5 sq mm', '2.5 sq mm', '4 sq mm', '6 sq mm']],
  ['Cable Tray', 'Electrical', ['m'], ['100 mm', '150 mm', '300 mm', '600 mm']],
]

const emptyRow = (): MtoRow => ({
  id: crypto.randomUUID(),
  description: '',
  specification: '',
  make: '',
  quantity: '',
  unit: 'Nos',
  imageRef: '',
})

const starterRows: MtoRow[] = [
  { id: 'sample-1', description: 'Pipe', specification: 'DN 600', make: '', quantity: '100', unit: 'm', imageRef: '' },
  { id: 'sample-2', description: 'Sluice Valve', specification: 'DN 600', make: '', quantity: '2', unit: 'Nos', imageRef: '' },
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
  const [title, setTitle] = useState('MATERIAL TAKE-OFF (MTO)')
  const [project, setProject] = useState('')
  const [requestDate, setRequestDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [needByDate, setNeedByDate] = useState('')
  const [requestedBy, setRequestedBy] = useState('')
  const [unloading, setUnloading] = useState('')
  const [department, setDepartment] = useState('Mechanical')
  const [contact, setContact] = useState('')
  const [remarks, setRemarks] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.mtoRows, JSON.stringify(rows))
  }, [rows])

  const totalRows = rows.length
  const filledRows = rows.filter((row) => row.description.trim()).length

  const updateRow = (id: string, key: keyof MtoRow, value: string) => {
    setRows((current) => current.map((row) => row.id === id ? { ...row, [key]: value } : row))
  }

  const chooseMaterial = (id: string, description: string) => {
    const item = materials.find(([name]) => name.toLowerCase() === description.toLowerCase())
    setRows((current) => current.map((row) => row.id === id
      ? { ...row, description: item?.[0] ?? description, unit: item?.[2]?.[0] ?? row.unit, specification: item?.[3]?.[0] ?? row.specification }
      : row))
  }

  const addRow = () => setRows((current) => [...current, emptyRow()])
  const removeRow = (id: string) => setRows((current) => current.filter((row) => row.id !== id))

  const clearAll = () => {
    if (!window.confirm('Clear all MTO items?')) return
    setRows([emptyRow()])
  }

  const clearForm = () => {
    if (!window.confirm('Clear the complete MTO form?')) return
    setRows([emptyRow()])
    setTitle('MATERIAL TAKE-OFF (MTO)')
    setProject('')
    setRequestDate(new Date().toISOString().slice(0, 10))
    setNeedByDate('')
    setRequestedBy('')
    setUnloading('')
    setDepartment('Mechanical')
    setContact('')
    setRemarks('')
  }

  const loadSample = () => {
    setRows(starterRows.map((row) => ({ ...row, id: crypto.randomUUID() })))
    setProject('Sample Project')
    setRequestedBy('Store / Site')
  }

  const downloadCsv = () => {
    const lines = [
      ['Sl. No.', 'Item Description', 'Specification / Size', 'Make', 'Quantity', 'Unit', 'Image Ref.'].map(csvCell).join(','),
      ...rows.map((row, index) => [String(index + 1), row.description, row.specification, row.make, row.quantity, row.unit, row.imageRef].map(csvCell).join(',')),
    ]
    const blob = new Blob([lines.join('\\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `MTO-${project.trim() || 'Sheet'}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const summary = useMemo(() => `${filledRows} / ${totalRows} items filled`, [filledRows, totalRows])

  return (
    <div className="page-stack">
      <header className="page-header print-hide">
        <div>
          <Link to={ROUTE_PATHS.tools}>← All tools</Link>
          <p className="eyebrow">Estimation</p>
          <h2>Material Take-Off Generator</h2>
          <p className="tool-description">A simple material list generator for site and project work.</p>
        </div>
        <div className="inline-actions">
          <Button type="button" variant="secondary" onClick={loadSample}>Load sample</Button>
          <Button type="button" variant="secondary" onClick={downloadCsv}>Download CSV</Button>
          <Button type="button" onClick={() => window.print()}>Print / PDF</Button>
        </div>
      </header>

      <Card className="panel">
        <div className="mto-reference-header">
          <div>
            <p className="eyebrow">MTO</p>
            <h1>{title}</h1>
            <p>Project material requirement sheet</p>
          </div>
          <div className="mto-summary">
            <strong>{summary}</strong>
            <small>Draft saved automatically in this browser.</small>
          </div>
        </div>

        <div className="mto-meta-grid">
          <label className="field-group"><span>Project *</span><input className="text-input" value={project} onChange={(event) => setProject(event.target.value)} placeholder="Project name" /></label>
          <label className="field-group"><span>Request Date *</span><input className="text-input" type="date" value={requestDate} onChange={(event) => setRequestDate(event.target.value)} /></label>
          <label className="field-group"><span>Need by Date</span><input className="text-input" type="date" value={needByDate} onChange={(event) => setNeedByDate(event.target.value)} /></label>
          <label className="field-group"><span>Requested By *</span><input className="text-input" value={requestedBy} onChange={(event) => setRequestedBy(event.target.value)} placeholder="Name / employee" /></label>
          <label className="field-group"><span>Unloading Point *</span><input className="text-input" value={unloading} onChange={(event) => setUnloading(event.target.value)} placeholder="Site / store" /></label>
          <label className="field-group"><span>Department *</span>
            <select className="text-input" value={department} onChange={(event) => setDepartment(event.target.value)}>
              <option>Mechanical</option><option>Electrical</option><option>Civil</option><option>Stores</option><option>Procurement</option><option>Other</option>
            </select>
          </label>
          <label className="field-group"><span>Contact No. *</span><input className="text-input" value={contact} onChange={(event) => setContact(event.target.value)} placeholder="Contact number" /></label>
          <label className="field-group mto-remarks-field"><span>Remarks</span><textarea className="text-area" value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder="Any additional instruction / requirement..." rows={2} /></label>
        </div>
      </Card>

      <Card className="panel mto-table-card">
        <div className="section-header print-hide">
          <div>
            <h3>Materials</h3>
            <p className="tool-description">Type a material name or pick a suggested material. Edit any cell as needed.</p>
          </div>
          <div className="inline-actions">
            <Button type="button" onClick={addRow}>+ Add Material</Button>
            <Button type="button" variant="secondary" onClick={clearAll}>Clear Items</Button>
            <Button type="button" variant="secondary" onClick={clearForm}>Clear Form</Button>
          </div>
        </div>

        <div className="mto-print-heading">
          <h1>{title}</h1>
          <p>{project || 'Project not entered'}{department ? ` · ${department}` : ''}</p>
          <p>{requestDate || ''}{needByDate ? ` · Need by ${needByDate}` : ''}</p>
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
                <th>Image Ref.</th>
                <th className="print-hide">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const suggestion = materials.find(([name]) => name.toLowerCase() === row.description.toLowerCase())
                const matching = row.description.trim()
                  ? materials.filter(([name]) => name.toLowerCase().includes(row.description.trim().toLowerCase())).slice(0, 5)
                  : materials.slice(0, 5)
                const specs = suggestion?.[3] ?? []
                const suggestedUnits = suggestion?.[2] ?? units
                return (
                  <tr key={row.id}>
                    <td>{index + 1}</td>
                    <td className="mto-description-cell">
                      <input
                        list={`mto-materials-${row.id}`}
                        className="table-input"
                        value={row.description}
                        onChange={(event) => updateRow(row.id, 'description', event.target.value)}
                        onBlur={() => chooseMaterial(row.id, row.description)}
                        placeholder="Material name"
                        aria-label={`Item ${index + 1} description`}
                      />
                      <datalist id={`mto-materials-${row.id}`}>
                        {matching.map(([name, category]) => <option key={name} value={name}>{category}</option>)}
                      </datalist>
                    </td>
                    <td>
                      <input list={`mto-specs-${row.id}`} className="table-input" value={row.specification} onChange={(event) => updateRow(row.id, 'specification', event.target.value)} placeholder="Specification / size" />
                      <datalist id={`mto-specs-${row.id}`}>{specs.map((spec) => <option key={spec} value={spec} />)}</datalist>
                    </td>
                    <td><input className="table-input" value={row.make} onChange={(event) => updateRow(row.id, 'make', event.target.value)} placeholder="Make" /></td>
                    <td><input className="table-input quantity-input" value={row.quantity} onChange={(event) => updateRow(row.id, 'quantity', event.target.value)} inputMode="decimal" /></td>
                    <td>
                      <select className="table-input" value={row.unit} onChange={(event) => updateRow(row.id, 'unit', event.target.value)}>
                        {[...new Set([...suggestedUnits, ...units])].map((unit) => <option key={unit}>{unit}</option>)}
                      </select>
                    </td>
                    <td><input className="table-input" value={row.imageRef} onChange={(event) => updateRow(row.id, 'imageRef', event.target.value)} placeholder="Drawing / image ref" /></td>
                    <td className="print-hide"><button type="button" className="table-delete" onClick={() => removeRow(row.id)} aria-label={`Delete item ${index + 1}`}>Delete</button></td>
                  </tr>
                )
              })}
              {!rows.length ? <tr><td colSpan={8} className="table-empty">No items yet. Click “+ Add Material”.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
