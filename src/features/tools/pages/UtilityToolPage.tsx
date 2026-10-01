import { useMemo, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card } from '../../../components/ui/Card'
import { ROUTE_PATHS } from '../../../app/config/constants'

const asNumber = (value: string) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function PipeWeightTool() {
  const [diameter, setDiameter] = useState('600')
  const [thickness, setThickness] = useState('8')
  const [length, setLength] = useState('1')
  const [density, setDensity] = useState('7850')
  const di = Math.max(0, asNumber(diameter) - 2 * asNumber(thickness))
  const area = Math.PI / 4 * (asNumber(diameter) ** 2 - di ** 2)
  const kgPerM = area * asNumber(density) / 1_000_000
  const total = kgPerM * asNumber(length)
  return <Calculator title="Pipe Weight Calculator" description="For a circular pipe. Enter outside diameter, wall thickness and length." fields={[
    ['Outside diameter (mm)', diameter, setDiameter], ['Thickness (mm)', thickness, setThickness], ['Length (m)', length, setLength], ['Density (kg/m³)', density, setDensity],
  ]} result={<><strong>{kgPerM.toFixed(2)} kg/m</strong><span>Total: {total.toFixed(2)} kg</span></>} />
}

function PipeVolumeTool() {
  const [diameter, setDiameter] = useState('1200')
  const [length, setLength] = useState('1000')
  const volume = Math.PI * (asNumber(diameter) / 1000) ** 2 / 4 * asNumber(length)
  return <Calculator title="Pipe Internal Volume" description="Calculate the approximate internal volume of a pipeline." fields={[
    ['Internal diameter (mm)', diameter, setDiameter], ['Pipe length (m)', length, setLength],
  ]} result={<><strong>{volume.toFixed(2)} m³</strong><span>{(volume * 1000).toFixed(0)} litres</span></>} />
}

function FlowVelocityTool() {
  const [flow, setFlow] = useState('930')
  const [diameter, setDiameter] = useState('1200')
  const area = Math.PI * (asNumber(diameter) / 1000) ** 2 / 4
  const velocity = area > 0 ? (asNumber(flow) / 1000) / area : 0
  return <Calculator title="Flow Velocity Calculator" description="Calculate average flow velocity in a circular pipe." fields={[
    ['Flow (L/s)', flow, setFlow], ['Pipe diameter (mm)', diameter, setDiameter],
  ]} result={<><strong>{velocity.toFixed(3)} m/s</strong><span>Flow: {asNumber(flow).toLocaleString()} L/s</span></>} />
}

function HeadLossTool() {
  const [flow, setFlow] = useState('930')
  const [diameter, setDiameter] = useState('1200')
  const [length, setLength] = useState('3041')
  const [roughness, setRoughness] = useState('140')
  const q = asNumber(flow) / 1000
  const d = asNumber(diameter) / 1000
  const l = asNumber(length)
  const c = Math.max(asNumber(roughness), 1)
  const headLoss = d > 0 ? 10.67 * l * q ** 1.852 / (c ** 1.852 * d ** 4.87) : 0
  return <Calculator title="Pipe Head Loss Calculator" description="Hazen-Williams estimate for water in a full circular pipe." fields={[
    ['Flow (L/s)', flow, setFlow], ['Pipe diameter (mm)', diameter, setDiameter], ['Length (m)', length, setLength], ['Hazen-Williams C', roughness, setRoughness],
  ]} result={<><strong>{headLoss.toFixed(2)} m</strong><span>Estimated friction head loss</span></>} />
}

function PipeAreaTool() {
  const [diameter, setDiameter] = useState('1200')
  const [length, setLength] = useState('100')
  const [coverage, setCoverage] = useState('8')
  const [coats, setCoats] = useState('1')
  const area = Math.PI * (asNumber(diameter) / 1000) * asNumber(length)
  const paint = asNumber(coverage) > 0 ? area * asNumber(coats) / asNumber(coverage) : 0
  return <Calculator title="Pipe Surface Area" description="Calculate external cylindrical area and a simple coating quantity estimate." fields={[
    ['Outside diameter (mm)', diameter, setDiameter], ['Length (m)', length, setLength], ['Coverage (m²/L)', coverage, setCoverage], ['Coats', coats, setCoats],
  ]} result={<><strong>{area.toFixed(2)} m²</strong><span>Approx. coating: {paint.toFixed(2)} L</span></>} />
}

function PipeQuantityTool() {
  const [totalLength, setTotalLength] = useState('3041')
  const [pieceLength, setPieceLength] = useState('12')
  const total = asNumber(totalLength)
  const piece = asNumber(pieceLength)
  const pieces = piece > 0 ? Math.ceil(total / piece) : 0
  const supplied = pieces * piece
  return <Calculator title="Pipe Quantity Calculator" description="Estimate how many standard-length pipe pieces are needed." fields={[
    ['Required length (m)', totalLength, setTotalLength], ['Standard pipe length (m)', pieceLength, setPieceLength],
  ]} result={<><strong>{pieces} pieces</strong><span>Supply length: {supplied.toFixed(2)} m · Extra: {Math.max(0, supplied - total).toFixed(2)} m</span></>} />
}

function SteelPlateWeightTool() {
  const [length, setLength] = useState('2000')
  const [width, setWidth] = useState('1000')
  const [thickness, setThickness] = useState('10')
  const [density, setDensity] = useState('7850')
  const volume = asNumber(length) / 1000 * (asNumber(width) / 1000) * (asNumber(thickness) / 1000)
  const weight = volume * asNumber(density)
  return <Calculator title="Steel Plate Weight Calculator" description="Calculate plate weight from dimensions. Density defaults to carbon steel." fields={[
    ['Length (mm)', length, setLength], ['Width (mm)', width, setWidth], ['Thickness (mm)', thickness, setThickness], ['Density (kg/m³)', density, setDensity],
  ]} result={<><strong>{weight.toFixed(2)} kg</strong><span>{(weight / 1000).toFixed(3)} ton</span></>} />
}

function PumpPowerTool() {
  const [flow, setFlow] = useState('100')
  const [head, setHead] = useState('60')
  const [efficiency, setEfficiency] = useState('75')
  const hydraulic = 9.81 * (asNumber(flow) / 1000) * asNumber(head)
  const shaft = hydraulic / Math.max(asNumber(efficiency) / 100, 0.01)
  return <Calculator title="Pump Power Calculator" description="Estimate pump power from flow, total head and overall efficiency." fields={[
    ['Flow (L/s)', flow, setFlow], ['Total head (m)', head, setHead], ['Efficiency (%)', efficiency, setEfficiency],
  ]} result={<><strong>{shaft.toFixed(2)} kW</strong><span>Hydraulic power: {hydraulic.toFixed(2)} kW</span></>} />
}

function PressureHeadTool() {
  const [pressure, setPressure] = useState('1')
  const [unit, setUnit] = useState<'bar' | 'MPa'>('bar')
  const pressureBar = unit === 'bar' ? asNumber(pressure) : asNumber(pressure) * 10
  const head = pressureBar * 10.19716213
  return <div className="calculator-card">
    <p className="eyebrow">Mechanical</p><h3>Pressure to Head Converter</h3>
    <p className="tool-description">Convert water pressure to approximate water head.</p>
    <div className="calculator-grid">
      <label className="field-group"><span>Pressure</span><input className="text-input" type="number" value={pressure} onChange={(event) => setPressure(event.target.value)} /></label>
      <label className="field-group"><span>Unit</span><select className="text-input" value={unit} onChange={(event) => setUnit(event.target.value as 'bar' | 'MPa')}><option>bar</option><option>MPa</option></select></label>
    </div>
    <div className="calculator-result"><strong>{head.toFixed(2)} mH₂O</strong><span>{(head * 3.28084).toFixed(2)} ft head</span></div>
  </div>
}

function SteelBarWeightTool() {
  const [diameter, setDiameter] = useState('16')
  const [length, setLength] = useState('12')
  const [quantity, setQuantity] = useState('10')
  const perBar = 0.006165 * asNumber(diameter) ** 2 * asNumber(length)
  const total = perBar * asNumber(quantity)
  return <Calculator title="Steel Bar Weight Calculator" description="Estimate reinforcement bar weight using the standard d²-based weight relation." fields={[
    ['Bar diameter (mm)', diameter, setDiameter], ['Bar length (m)', length, setLength], ['Number of bars', quantity, setQuantity],
  ]} result={<><strong>{total.toFixed(2)} kg</strong><span>Per bar: {perBar.toFixed(2)} kg</span></>} />
}

function ConcreteTool() {
  const [length, setLength] = useState('5')
  const [width, setWidth] = useState('2')
  const [height, setHeight] = useState('0.15')
  const volume = asNumber(length) * asNumber(width) * asNumber(height)
  return <Calculator title="Concrete Volume Calculator" description="Calculate concrete volume from length × width × height." fields={[
    ['Length (m)', length, setLength], ['Width (m)', width, setWidth], ['Height / Depth (m)', height, setHeight],
  ]} result={<><strong>{volume.toFixed(3)} m³</strong><span>{(volume * 35.3147).toFixed(1)} ft³</span></>} />
}

function ExcavationTool() {
  const [length, setLength] = useState('100')
  const [width, setWidth] = useState('1.5')
  const [depth, setDepth] = useState('1.5')
  const [pipeDiameter, setPipeDiameter] = useState('600')
  const [bedding, setBedding] = useState('0.15')
  const excavation = asNumber(length) * asNumber(width) * asNumber(depth)
  const pipe = Math.PI * (asNumber(pipeDiameter) / 1000) ** 2 / 4 * asNumber(length)
  const beddingVolume = asNumber(length) * asNumber(width) * asNumber(bedding)
  const backfill = Math.max(0, excavation - pipe - beddingVolume)
  return <Calculator title="Excavation & Backfill Calculator" description="Pipeline trench estimate: excavation less pipe displacement and bedding volume." fields={[
    ['Length (m)', length, setLength], ['Trench width (m)', width, setWidth], ['Trench depth (m)', depth, setDepth], ['Pipe diameter (mm)', pipeDiameter, setPipeDiameter], ['Bedding thickness (m)', bedding, setBedding],
  ]} result={<><strong>Excavation: {excavation.toFixed(2)} m³</strong><span>Approx. backfill: {backfill.toFixed(2)} m³ · Pipe displacement: {pipe.toFixed(2)} m³</span></>} />
}

function TankVolumeTool() {
  const [shape, setShape] = useState<'rectangular' | 'cylindrical'>('rectangular')
  const [length, setLength] = useState('10')
  const [width, setWidth] = useState('5')
  const [height, setHeight] = useState('3')
  const volume = shape === 'rectangular'
    ? asNumber(length) * asNumber(width) * asNumber(height)
    : Math.PI * (asNumber(length) / 2) ** 2 * asNumber(height)
  return <div className="calculator-card">
    <p className="eyebrow">Civil / WTP</p><h3>Tank Volume Calculator</h3>
    <p className="tool-description">Calculate approximate tank capacity for rectangular or circular tanks.</p>
    <label className="field-group"><span>Shape</span><select className="text-input" value={shape} onChange={(event) => setShape(event.target.value as 'rectangular' | 'cylindrical')}><option value="rectangular">Rectangular</option><option value="cylindrical">Circular</option></select></label>
    <div className="calculator-grid">
      <label className="field-group"><span>{shape === 'rectangular' ? 'Length (m)' : 'Diameter (m)'}</span><input className="text-input" type="number" value={length} onChange={(event) => setLength(event.target.value)} /></label>
      {shape === 'rectangular' ? <label className="field-group"><span>Width (m)</span><input className="text-input" type="number" value={width} onChange={(event) => setWidth(event.target.value)} /></label> : null}
      <label className="field-group"><span>Water depth / height (m)</span><input className="text-input" type="number" value={height} onChange={(event) => setHeight(event.target.value)} /></label>
    </div>
    <div className="calculator-result"><strong>{volume.toFixed(2)} m³</strong><span>{(volume * 1000).toFixed(0)} litres</span></div>
  </div>
}

function WastageTool() {
  const [quantity, setQuantity] = useState('100')
  const [wastage, setWastage] = useState('5')
  const base = asNumber(quantity)
  const extra = base * asNumber(wastage) / 100
  return <Calculator title="Wastage Calculator" description="Add a wastage percentage to a material quantity." fields={[
    ['Quantity', quantity, setQuantity], ['Wastage (%)', wastage, setWastage],
  ]} result={<><strong>Total: {(base + extra).toFixed(3)}</strong><span>Wastage: {extra.toFixed(3)}</span></>} />
}

const unitSets = {
  Length: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048 },
  Area: { 'mm²': 0.000001, 'm²': 1, 'ft²': 0.09290304 },
  Volume: { L: 0.001, 'm³': 1, 'ft³': 0.0283168466 },
  Weight: { kg: 1, ton: 1000, lb: 0.45359237 },
} as const

function UnitConverterTool() {
  const [group, setGroup] = useState<keyof typeof unitSets>('Length')
  const units = Object.keys(unitSets[group]) as Array<keyof typeof unitSets[typeof group]>
  const [from, setFrom] = useState('mm')
  const [to, setTo] = useState('m')
  const [value, setValue] = useState('1000')
  const result = useMemo(() => {
    const map = unitSets[group] as Record<string, number>
    const base = asNumber(value) * (map[from] ?? 1)
    return base / (map[to] ?? 1)
  }, [group, value, from, to])

  const changeGroup = (next: keyof typeof unitSets) => {
    const nextUnits = Object.keys(unitSets[next])
    setGroup(next); setFrom(nextUnits[0]); setTo(nextUnits[1] ?? nextUnits[0])
  }

  return <div className="calculator-card">
    <label className="field-group"><span>Type</span><select className="text-input" value={group} onChange={(event) => changeGroup(event.target.value as keyof typeof unitSets)}>{Object.keys(unitSets).map((item) => <option key={item}>{item}</option>)}</select></label>
    <div className="calculator-grid">
      <label className="field-group"><span>Value</span><input className="text-input" type="number" value={value} onChange={(event) => setValue(event.target.value)} /></label>
      <label className="field-group"><span>From</span><select className="text-input" value={from} onChange={(event) => setFrom(event.target.value)}>{units.map((unit) => <option key={unit}>{unit}</option>)}</select></label>
      <label className="field-group"><span>To</span><select className="text-input" value={to} onChange={(event) => setTo(event.target.value)}>{units.map((unit) => <option key={unit}>{unit}</option>)}</select></label>
    </div>
    <div className="calculator-result"><strong>{result.toLocaleString(undefined, { maximumFractionDigits: 6 })} {to}</strong></div>
  </div>
}

type Field = [string, string, (value: string) => void]

function Calculator({ title, description, fields, result }: { title: string; description: string; fields: Field[]; result: ReactNode }) {
  return (
    <div className="calculator-card">
      <p className="eyebrow">Calculator</p>
      <h3>{title}</h3>
      <p className="tool-description">{description}</p>
      <div className="calculator-grid">
        {fields.map(([label, value, onChange]) => <label className="field-group" key={label}><span>{label}</span><input className="text-input" type="number" value={value} onChange={(event) => onChange(event.target.value)} /></label>)}
      </div>
      <div className="calculator-result">{result}</div>
    </div>
  )
}

export function UtilityToolPage() {
  const { toolSlug } = useParams()
  const content = toolSlug === 'pipe-weight'
    ? <PipeWeightTool />
    : toolSlug === 'pipe-volume'
      ? <PipeVolumeTool />
      : toolSlug === 'flow-velocity'
        ? <FlowVelocityTool />
        : toolSlug === 'head-loss'
          ? <HeadLossTool />
          : toolSlug === 'pipe-area'
            ? <PipeAreaTool />
            : toolSlug === 'pipe-quantity'
              ? <PipeQuantityTool />
              : toolSlug === 'steel-plate-weight'
                ? <SteelPlateWeightTool />
                : toolSlug === 'pump-power'
                  ? <PumpPowerTool />
                  : toolSlug === 'pressure-head'
                    ? <PressureHeadTool />
                    : toolSlug === 'steel-bar-weight'
                      ? <SteelBarWeightTool />
                      : toolSlug === 'concrete-volume'
                        ? <ConcreteTool />
                        : toolSlug === 'excavation-volume'
                          ? <ExcavationTool />
                          : toolSlug === 'trench-volume'
                            ? <ExcavationTool />
                            : toolSlug === 'tank-volume'
                              ? <TankVolumeTool />
                              : toolSlug === 'wastage'
                                ? <WastageTool />
                                : <UnitConverterTool />

  return (
    <div className="page-stack">
      <header className="page-header print-hide">
        <Link to={ROUTE_PATHS.tools}>← All tools</Link>
      </header>
      <Card className="panel">
        {content}
      </Card>
      <div><Link to={ROUTE_PATHS.mtoGenerator}>Open MTO Generator →</Link></div>
    </div>
  )
}
