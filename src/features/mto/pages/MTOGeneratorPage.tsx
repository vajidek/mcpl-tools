import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

type MtoRow = {
  id: string
  description: string
  specification: string
  make: string
  quantity: string
  unit: string
  imageName: string
  imageDataUrl: string
}

type MtoDraft = {
  project: string
  requestDate: string
  needByDate: string
  requestedBy: string
  unloading: string
  department: string
  contact: string
  remarks: string
  rows: MtoRow[]
}

const STORAGE_KEY = 'mcpl-tools.mto-reference.v4'
const UNITS = ['Nos', 'Set', 'm', 'MTR', 'kg', 'Kg', 'MT', 'ton', 'Ltr', 'm²', 'm³', 'Pair', 'Box', 'LS']

type MaterialReference = {
  name: string
  category: string
  units: string[]
  specs: string[]
}

const MATERIALS: MaterialReference[] = [
  { name: 'Pipe', category: 'Piping', units: ['m', 'Nos'], specs: ['DN 100', 'DN 150', 'DN 200', 'DN 300', 'DN 400', 'DN 500', 'DN 600', 'DN 800', 'DN 1000', 'DN 1200'] },
  { name: 'Sluice Valve', category: 'Valves', units: ['Nos'], specs: ['DN 100', 'DN 150', 'DN 200', 'DN 300', 'DN 400', 'DN 600', 'DN 800', 'DN 1000', 'DN 1200'] },
  { name: 'Butterfly Valve', category: 'Valves', units: ['Nos'], specs: ['DN 100', 'DN 150', 'DN 200', 'DN 300', 'DN 400', 'DN 600', 'DN 800', 'DN 1000', 'DN 1200'] },
  { name: 'Air Valve', category: 'Valves', units: ['Nos'], specs: ['DN 50', 'DN 80', 'DN 100', 'DN 150', 'DN 200', 'DN 250'] },
  { name: 'Scour Valve', category: 'Valves', units: ['Nos'], specs: ['DN 150', 'DN 200', 'DN 300', 'DN 400', 'DN 500', 'DN 600'] },
  { name: 'Dismantling Joint', category: 'Piping', units: ['Nos'], specs: ['DN 100', 'DN 150', 'DN 200', 'DN 300', 'DN 400', 'DN 600', 'DN 800', 'DN 1200'] },
  { name: 'Flange', category: 'Piping', units: ['Nos', 'Set'], specs: ['DN 100', 'DN 150', 'DN 200', 'DN 300', 'DN 400', 'DN 600', 'DN 800', 'DN 1000', 'DN 1200'] },
  { name: 'Gasket', category: 'Piping', units: ['Nos', 'Set'], specs: ['DN 100', 'DN 150', 'DN 200', 'DN 300', 'DN 400', 'DN 600', 'DN 800', 'DN 1000', 'DN 1200'] },
  { name: 'Hex Bolt', category: 'Fasteners', units: ['Nos'], specs: ['M12', 'M16 x 75 mm', 'M20 x 100 mm', 'M24 x 120 mm', 'M30 x 150 mm'] },
  { name: 'Nut', category: 'Fasteners', units: ['Nos'], specs: ['M12', 'M16', 'M20', 'M24', 'M30'] },
  { name: 'Washer', category: 'Fasteners', units: ['Nos'], specs: ['M12', 'M16', 'M20', 'M24', 'M30'] },
  { name: 'Anchor Bolt', category: 'Fasteners', units: ['Nos'], specs: ['M16', 'M20', 'M24', 'M30'] },
  { name: 'Pump', category: 'Mechanical', units: ['Nos', 'Set'], specs: ['As per approved specification'] },
  { name: 'Motor', category: 'Mechanical', units: ['Nos', 'Set'], specs: ['As per approved specification'] },
  { name: 'Mechanical Seal', category: 'Mechanical', units: ['Nos', 'Set'], specs: ['As per pump model'] },
  { name: 'Coupling', category: 'Mechanical', units: ['Nos', 'Set'], specs: ['As per equipment'] },
  { name: 'Cable', category: 'Electrical', units: ['m'], specs: ['1.5 sq mm', '2.5 sq mm', '4 sq mm', '6 sq mm', '10 sq mm', '16 sq mm'] },
  { name: 'Cable Tray', category: 'Electrical', units: ['m'], specs: ['100 mm', '150 mm', '300 mm', '450 mm', '600 mm'] },
  { name: 'Steel Plate', category: 'Structural', units: ['kg', 'MT', 'Nos'], specs: ['3 mm', '5 mm', '6 mm', '8 mm', '10 mm', '12 mm', '16 mm', '20 mm'] },
  { name: 'MS Angle', category: 'Structural', units: ['m', 'kg', 'MT'], specs: ['25 x 25 x 3', '40 x 40 x 5', '50 x 50 x 6', '65 x 65 x 6'] },
  { name: 'MS Channel', category: 'Structural', units: ['m', 'kg', 'MT'], specs: ['75 mm', '100 mm', '125 mm', '150 mm', '200 mm'] },
  { name: 'Welding Electrode', category: 'Consumable', units: ['kg', 'Box'], specs: ['E6013', 'E7018'] },
  { name: 'Cutting Wheel', category: 'Consumable', units: ['Nos', 'Box'], specs: ['4 inch', '7 inch', '14 inch'] },
  { name: 'Rubber Sheet', category: 'Piping', units: ['m²', 'kg'], specs: ['3 mm', '5 mm', '6 mm'] },
  { name: 'PVC Pipe', category: 'Piping', units: ['m', 'Nos'], specs: ['20 mm', '25 mm', '40 mm', '50 mm', '75 mm', '110 mm'] },
]

const today = () => new Date().toISOString().slice(0, 10)
const createRow = (): MtoRow => ({ id: crypto.randomUUID(), description: '', specification: '', make: '', quantity: '', unit: 'Nos', imageName: '', imageDataUrl: '' })
const createDefaultDraft = (): MtoDraft => ({ project: '', requestDate: today(), needByDate: '', requestedBy: '', unloading: '', department: 'Mechanical', contact: '', remarks: '', rows: [createRow()] })

const loadDraft = (): MtoDraft => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? { ...createDefaultDraft(), ...(JSON.parse(saved) as Partial<MtoDraft>) } : createDefaultDraft()
  } catch {
    return createDefaultDraft()
  }
}

const saveDraft = (draft: MtoDraft) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)) } catch { /* Keep working in memory when browser storage is full. */ }
}

const resizeImage = (file: File) => new Promise<{ name: string; dataUrl: string }>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => {
    const image = new Image()
    image.onload = () => {
      const max = 900
      const scale = Math.min(1, max / Math.max(image.naturalWidth, image.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      const context = canvas.getContext('2d')
      if (!context) { reject(new Error('Image processing is not available.')); return }
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      resolve({ name: file.name, dataUrl: canvas.toDataURL('image/jpeg', 0.78) })
    }
    image.onerror = () => reject(new Error('Could not read the selected image.'))
    image.src = String(reader.result)
  }
  reader.onerror = () => reject(new Error('Could not read the selected image.'))
  reader.readAsDataURL(file)
})

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const escapeCsv = (value: string) => '"' + value.replaceAll('"', '""') + '"'

function parseDelimited(text: string): string[][] {
  const delimiter = text.includes('\t') ? '\t' : ','
  const output: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]
    if (char === '"' && quoted && next === '"') { cell += '"'; index += 1 }
    else if (char === '"') quoted = !quoted
    else if (char === delimiter && !quoted) { row.push(cell); cell = '' }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1
      row.push(cell); output.push(row); row = []; cell = ''
    } else cell += char
  }
  if (cell || row.length) { row.push(cell); output.push(row) }
  return output.filter((item) => item.some((value) => value.trim()))
}

const normalizeHeader = (value: string) => value.toLowerCase().replace(/[._/-]+/g, ' ').replace(/\s+/g, ' ').trim()

export function MTOGeneratorPage() {
  const [draft, setDraft] = useState<MtoDraft>(() => loadDraft())
  const [showMaterials, setShowMaterials] = useState(false)
  const [materialSearch, setMaterialSearch] = useState('')
  const importRef = useRef<HTMLInputElement>(null)

  useEffect(() => { saveDraft(draft) }, [draft])

  const { project, requestDate, needByDate, requestedBy, unloading, department, contact, remarks, rows } = draft
  const setField = <K extends keyof Omit<MtoDraft, 'rows'>>(key: K, value: MtoDraft[K]) => setDraft((current) => ({ ...current, [key]: value }))

  const filteredMaterials = useMemo(() => {
    const term = materialSearch.trim().toLowerCase()
    return MATERIALS.filter((item) => !term || (item.name + ' ' + item.category).toLowerCase().includes(term))
  }, [materialSearch])

  const updateRow = (id: string, key: keyof MtoRow, value: string) => setDraft((current) => ({ ...current, rows: current.rows.map((row) => row.id === id ? { ...row, [key]: value } : row) }))

  const applyMaterial = (id: string, name: string) => {
    const item = MATERIALS.find((material) => material.name.toLowerCase() === name.trim().toLowerCase())
    if (!item) return
    setDraft((current) => ({ ...current, rows: current.rows.map((row) => row.id === id ? { ...row, description: item.name, specification: row.specification || item.specs[0] || '', unit: item.units[0] || row.unit } : row) }))
  }

  const addRow = (material?: MaterialReference) => {
    const row = createRow()
    if (material) { row.description = material.name; row.specification = material.specs[0] || ''; row.unit = material.units[0] || 'Nos' }
    setDraft((current) => ({ ...current, rows: [...current.rows, row] }))
  }

  const removeRow = (id: string) => setDraft((current) => ({ ...current, rows: current.rows.filter((row) => row.id !== id) }))

  const clearItems = () => {
    if (!window.confirm('Clear all material items?')) return
    setDraft((current) => ({ ...current, rows: [createRow()] }))
  }

  const clearForm = () => {
    if (!window.confirm('Clear the complete MTO form?')) return
    setDraft(createDefaultDraft())
  }

  const addImage = async (id: string, file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { window.alert('Please select an image file.'); return }
    try {
      const result = await resizeImage(file)
      setDraft((current) => ({ ...current, rows: current.rows.map((row) => row.id === id ? { ...row, imageName: result.name, imageDataUrl: result.dataUrl } : row) }))
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not add image.')
    }
  }

  const exportExcel = () => {
    const rowsHtml = rows.map((row, index) => '<tr><td>' + (index + 1) + '</td><td>' + escapeHtml(row.description) + '</td><td>' + escapeHtml(row.specification) + '</td><td>' + escapeHtml(row.make) + '</td><td>' + escapeHtml(row.quantity) + '</td><td>' + escapeHtml(row.unit) + '</td><td>' + (row.imageName ? 'Image attached' : '') + '</td></tr>').join('')
    const html = '<!doctype html><html><head><meta charset="utf-8"></head><body><h2>MATERIAL TAKE-OFF (MTO)</h2>'
      + '<p><b>Project:</b> ' + escapeHtml(project) + ' &nbsp; <b>Request Date:</b> ' + escapeHtml(requestDate) + '</p>'
      + '<p><b>Need by Date:</b> ' + escapeHtml(needByDate) + ' &nbsp; <b>Requested By:</b> ' + escapeHtml(requestedBy) + '</p>'
      + '<p><b>Unloading Point:</b> ' + escapeHtml(unloading) + ' &nbsp; <b>Department:</b> ' + escapeHtml(department) + '</p>'
      + '<p><b>Contact No.:</b> ' + escapeHtml(contact) + '</p><p><b>Remarks:</b> ' + escapeHtml(remarks) + '</p>'
      + '<table border="1" cellspacing="0" cellpadding="6"><thead><tr><th>Sl. No.</th><th>Item Description</th><th>Specification / Size</th><th>Make</th><th>Quantity</th><th>Unit</th><th>Image Ref.</th></tr></thead><tbody>' + rowsHtml + '</tbody></table></body></html>'
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = (project.trim() || 'MTO') + '.xls'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const exportCsv = () => {
    const lines = [
      ['Sl. No.', 'Item Description', 'Specification / Size', 'Make', 'Quantity', 'Unit', 'Image Ref.'].map(escapeCsv).join(','),
      ...rows.map((row, index) => [String(index + 1), row.description, row.specification, row.make, row.quantity, row.unit, row.imageName].map(escapeCsv).join(',')),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = (project.trim() || 'MTO') + '.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (file: File | undefined) => {
    if (!file) return
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!['csv', 'tsv', 'txt'].includes(extension || '')) { window.alert('Import CSV, TSV or TXT material lists in this version.'); return }
    const parsed = parseDelimited(await file.text())
    if (parsed.length < 2) { window.alert('No material rows found.'); return }
    const headers = parsed[0].map(normalizeHeader)
    const findIndex = (names: string[]) => names.map((name) => headers.indexOf(name)).find((index) => index >= 0) ?? -1
    const descriptionIndex = findIndex(['item description', 'description', 'item'])
    const specificationIndex = findIndex(['specification size', 'specification', 'spec size', 'size'])
    const makeIndex = findIndex(['make', 'brand'])
    const quantityIndex = findIndex(['quantity', 'qty'])
    const unitIndex = findIndex(['unit'])
    const imported = parsed.slice(1).map((cells) => ({
      ...createRow(),
      description: descriptionIndex >= 0 ? cells[descriptionIndex]?.trim() || '' : '',
      specification: specificationIndex >= 0 ? cells[specificationIndex]?.trim() || '' : '',
      make: makeIndex >= 0 ? cells[makeIndex]?.trim() || '' : '',
      quantity: quantityIndex >= 0 ? cells[quantityIndex]?.trim() || '' : '',
      unit: unitIndex >= 0 ? cells[unitIndex]?.trim() || 'Nos' : 'Nos',
    })).filter((row) => row.description || row.specification || row.quantity)
    if (!imported.length) { window.alert('No usable material rows found.'); return }
    setDraft((current) => ({ ...current, rows: imported }))
  }

  const openImage = (url: string) => { window.open(url, '_blank', 'noopener,noreferrer') }

  return (
    <div className="mto-generator-app">
      <div className="mto-toolbar no-print">
        <div className="mto-toolbar-brand">
          <img src={`${import.meta.env.BASE_URL}midland-logo.svg`} alt="Midland Contracting Private Limited" />
          <div><h1>Midland MTO List Generator</h1><small>Mechanical Division Project Management</small></div>
        </div>
        <div className="mto-toolbar-actions">
          <button className="mto-btn mto-btn-green" type="button" onClick={exportExcel}>Export Excel</button>
          <button className="mto-btn mto-btn-blue" type="button" onClick={() => window.print()}>Export PDF</button>
          <button className="mto-btn mto-btn-gray" type="button" onClick={clearForm}>Clear Form</button>
          <button className="mto-btn mto-btn-gray" type="button" onClick={() => importRef.current?.click()}>Import</button>
          <button className="mto-btn mto-btn-gray" type="button" onClick={() => setShowMaterials(true)}>Materials</button>
          <button className="mto-btn mto-btn-gray mto-btn-optional" type="button" onClick={exportCsv}>CSV</button>
          <input ref={importRef} type="file" accept=".csv,.tsv,.txt" className="mto-hidden-input" onChange={(event) => { void handleImport(event.target.files?.[0]); event.currentTarget.value = '' }} />
        </div>
      </div>

      <div className="mto-paper">
        <div className="mto-document-header">
          <img className="mto-document-logo" src={`${import.meta.env.BASE_URL}midland-logo.svg`} alt="Midland Contracting Private Limited" />
          <div className="mto-document-title"><h2>MATERIAL TAKE-OFF (MTO)</h2><div>Mechanical Division Project Management</div></div>
          <div />
        </div>

        <div className="mto-meta">
          <label className="mto-field"><span>Project: <b>*</b></span><input value={project} onChange={(event) => setField('project', event.target.value)} placeholder="Enter project name" /></label>
          <label className="mto-field"><span>Request Date: <b>*</b></span><input type="date" value={requestDate} onChange={(event) => setField('requestDate', event.target.value)} /></label>
          <label className="mto-field"><span>Need by Date:</span><input type="date" value={needByDate} onChange={(event) => setField('needByDate', event.target.value)} /></label>
          <label className="mto-field"><span>Requested By: <b>*</b></span><input value={requestedBy} onChange={(event) => setField('requestedBy', event.target.value)} placeholder="Enter name / employee ID" /></label>
          <label className="mto-field"><span>Unloading Point: <b>*</b></span><input value={unloading} onChange={(event) => setField('unloading', event.target.value)} placeholder="Enter unloading point" /></label>
          <label className="mto-field"><span>Department: <b>*</b></span><select value={department} onChange={(event) => setField('department', event.target.value)}><option>Mechanical</option><option>Electrical</option><option>Civil</option><option>Stores</option><option>Procurement</option><option>Other</option></select></label>
          <label className="mto-field"><span>Contact No.: <b>*</b></span><input value={contact} onChange={(event) => setField('contact', event.target.value)} placeholder="Contact number" /></label>
        </div>

        <label className="mto-remarks"><span>Remarks:</span><textarea value={remarks} onChange={(event) => setField('remarks', event.target.value)} placeholder="Any additional instruction / requirement..." /></label>

        <div className="mto-table-wrap">
          <table className="mto-document-table">
            <thead><tr><th className="sl">Sl. No.</th><th className="desc">Item Description</th><th className="spec">Specification / Size</th><th className="make">Make</th><th className="qty">Quantity</th><th className="unit">Unit</th><th className="ref">Image Ref.</th><th className="action no-print">Action</th></tr></thead>
            <tbody>
              {rows.map((row, index) => {
                const selected = MATERIALS.find((material) => material.name.toLowerCase() === row.description.toLowerCase())
                const matching = row.description.trim() ? MATERIALS.filter((material) => material.name.toLowerCase().includes(row.description.trim().toLowerCase())).slice(0, 8) : MATERIALS.slice(0, 8)
                return (
                  <tr key={row.id}>
                    <td className="sl">{index + 1}</td>
                    <td className="desc"><input list={'mto-material-list-' + row.id} value={row.description} onChange={(event) => updateRow(row.id, 'description', event.target.value)} onBlur={() => applyMaterial(row.id, row.description)} placeholder="Item Description" /><datalist id={'mto-material-list-' + row.id}>{matching.map((item) => <option key={item.name} value={item.name} />)}</datalist></td>
                    <td className="spec"><input list={'mto-spec-list-' + row.id} value={row.specification} onChange={(event) => updateRow(row.id, 'specification', event.target.value)} placeholder="Specification / Size" /><datalist id={'mto-spec-list-' + row.id}>{(selected?.specs || []).map((spec) => <option key={spec} value={spec} />)}</datalist></td>
                    <td className="make"><input value={row.make} onChange={(event) => updateRow(row.id, 'make', event.target.value)} placeholder="Optional brand / make" /></td>
                    <td className="qty"><input type="number" min="0" step="any" value={row.quantity} onChange={(event) => updateRow(row.id, 'quantity', event.target.value)} placeholder="0" /></td>
                    <td className="unit"><select value={row.unit} onChange={(event) => updateRow(row.id, 'unit', event.target.value)}>{[...new Set([...(selected?.units || []), ...UNITS])].map((unit) => <option key={unit}>{unit}</option>)}</select></td>
                    <td className="ref">
                      {row.imageDataUrl ? <div className="mto-image-preview"><img src={row.imageDataUrl} alt={row.description || 'Material reference'} onClick={() => openImage(row.imageDataUrl)} /><div><button className="mto-image-link no-print" type="button" onClick={() => openImage(row.imageDataUrl)}>View</button><button className="mto-image-remove no-print" type="button" onClick={() => updateRow(row.id, 'imageName', '') || updateRow(row.id, 'imageDataUrl', '')}>Remove</button></div><small className="no-print">{row.imageName}</small></div>
                      : <label className="mto-image-add"><span>＋ Add Image</span><input type="file" accept="image/*" onChange={(event) => { void addImage(row.id, event.target.files?.[0]); event.currentTarget.value = '' }} /></label>}
                    </td>
                    <td className="action no-print"><button className="mto-delete" type="button" onClick={() => removeRow(row.id)} title="Delete row">🗑</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mto-below-actions no-print"><button className="mto-btn mto-btn-blue" type="button" onClick={() => addRow()}>＋ Add Material</button><button className="mto-btn mto-btn-gray" type="button" onClick={clearItems}>Clear Items</button></div>
        <div className="mto-help no-print"><strong>How to use:</strong> Fill the header details → add materials → attach an image when needed → export the finished MTO.</div>
      </div>

      {showMaterials ? (
        <div className="mto-modal-backdrop no-print" role="dialog" aria-modal="true" aria-label="Materials">
          <div className="mto-material-modal">
            <div className="mto-modal-header"><div><h3>Material Reference Catalogue</h3><p>Select a common material to add a row.</p></div><button className="mto-modal-close" type="button" onClick={() => setShowMaterials(false)}>×</button></div>
            <input className="mto-modal-search" value={materialSearch} onChange={(event) => setMaterialSearch(event.target.value)} placeholder="Search material..." />
            <div className="mto-material-list">
              {filteredMaterials.map((item) => <button key={item.name} type="button" className="mto-material-option" onClick={() => { addRow(item); setShowMaterials(false) }}><span><strong>{item.name}</strong><small>{item.category} · {item.units.join(', ')}</small></span><b>＋ Add</b></button>)}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
