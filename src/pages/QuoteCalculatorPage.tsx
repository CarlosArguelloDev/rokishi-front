import { type FormEvent, useEffect, useState } from 'react'
import { Banner } from '@cloudflare/kumo/components/banner'
import { Button } from '@cloudflare/kumo/components/button'
import { Input } from '@cloudflare/kumo/components/input'
import { Select } from '@cloudflare/kumo/components/select'
import { Calculator, Cube, Lightning, Printer, Receipt, Wrench } from '@phosphor-icons/react'
import { ApiError } from '../api/client'
import { listMaterials, type Material } from '../api/costs'
import { listMachines, type Machine } from '../api/machines'
import { calculateQuote, type QuoteCalculation } from '../api/quotes'
import PageHeader from '../components/PageHeader'

type QuoteForm = {
  machineID: string
  materialID: string
  materialGrams: string
  durationMinutes: string
  pieceCount: string
}

const EMPTY_FORM: QuoteForm = {
  machineID: '',
  materialID: '',
  materialGrams: '',
  durationMinutes: '',
  pieceCount: '1',
}

const moneyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
})

function formatMoney(value: number) {
  return moneyFormatter.format(value)
}

export default function QuoteCalculatorPage() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [form, setForm] = useState<QuoteForm>(EMPTY_FORM)
  const [result, setResult] = useState<QuoteCalculation | null>(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [calculationError, setCalculationError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(async () => {
      try {
        const [machineData, materialData] = await Promise.all([
          listMachines({ activa: true }, controller.signal),
          listMaterials({ activo: true }, controller.signal),
        ])
        if (controller.signal.aborted) return
        setMachines(machineData)
        setMaterials(materialData)
        setForm((current) => ({
          ...current,
          machineID: machineData[0] ? String(machineData[0].id) : '',
          materialID: materialData[0] ? String(materialData[0].id) : '',
        }))
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(error instanceof ApiError ? error.message : 'No se pudieron cargar maquinas y materiales.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    })
    return () => controller.abort()
  }, [])

  function updateField(field: keyof QuoteForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setResult(null)
    setCalculationError('')
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (calculating) return

    const grams = Number(form.materialGrams)
    const duration = Number(form.durationMinutes)
    const pieces = Number(form.pieceCount)
    if (!form.machineID || !form.materialID) {
      setCalculationError('Selecciona una maquina y un material activos.')
      return
    }
    if (!/^\d+(?:\.\d{1,3})?$/.test(form.materialGrams) || grams <= 0) {
      setCalculationError('El material debe ser mayor a cero y puede tener hasta 3 decimales.')
      return
    }
    if (!Number.isInteger(duration) || duration < 1 || duration > 5256000) {
      setCalculationError('La duracion debe ser un numero entero de minutos mayor a cero.')
      return
    }
    if (!Number.isInteger(pieces) || pieces < 1 || pieces > 1000000) {
      setCalculationError('La cantidad de piezas debe ser un entero mayor a cero.')
      return
    }

    setCalculating(true)
    setCalculationError('')
    try {
      const calculation = await calculateQuote({
        maquina_id: Number(form.machineID),
        material_id: Number(form.materialID),
        cantidad_material_gramos: grams,
        duracion_minutos: duration,
        cantidad_piezas: pieces,
      })
      setResult(calculation)
    } catch (error) {
      setResult(null)
      setCalculationError(error instanceof ApiError ? error.message : 'No se pudo calcular la cotizacion.')
    } finally {
      setCalculating(false)
    }
  }

  const machineItems = machines.map((machine) => ({
    value: String(machine.id),
    label: `${machine.codigo} - ${machine.nombre}`,
  }))
  const materialItems = materials.map((material) => ({
    value: String(material.id),
    label: `${material.nombre} - ${material.tipo}`,
  }))
  const selectedMachine = machines.find((machine) => String(machine.id) === form.machineID)

  return (
    <div>
      <PageHeader title="Cotizador" description="Calcula el costo y precio sugerido de un lote de impresion." action={<span />} />

      <div className="feedback-stack" aria-live="polite">
        {loadError && <Banner variant="error" title="Catalogos no disponibles" description={loadError} />}
        {calculationError && <Banner variant="error" title="No se pudo calcular" description={calculationError} />}
      </div>

      <div className="quote-workspace">
        <section className="quote-input-section" aria-labelledby="quote-input-title">
          <div className="quote-section-heading">
            <div>
              <h2 id="quote-input-title">Datos del lote</h2>
              <p>Los gramos y minutos corresponden al lote completo.</p>
            </div>
          </div>

          <form className="quote-form" onSubmit={submit}>
            <Select label="Maquina" placeholder={loading ? 'Cargando...' : 'Selecciona una maquina'} value={form.machineID} onValueChange={(value) => updateField('machineID', value ?? '')} items={machineItems} disabled={loading || machines.length === 0} />
            <Select label="Material" placeholder={loading ? 'Cargando...' : 'Selecciona un material'} value={form.materialID} onValueChange={(value) => updateField('materialID', value ?? '')} items={materialItems} disabled={loading || materials.length === 0} />
            <div className="quote-number-grid">
              <Input label="Material total (g)" type="number" min="0.001" step="0.001" value={form.materialGrams} onChange={(event) => updateField('materialGrams', event.target.value)} />
              <Input label="Duracion total (min)" type="number" min="1" step="1" value={form.durationMinutes} onChange={(event) => updateField('durationMinutes', event.target.value)} />
              <Input label="Cantidad de piezas" type="number" min="1" step="1" value={form.pieceCount} onChange={(event) => updateField('pieceCount', event.target.value)} />
            </div>
            <div className="quote-form-meta">
              {selectedMachine && <span>{selectedMachine.locacion_codigo} - {selectedMachine.potencia_watts === null ? 'Potencia sin configurar' : `${selectedMachine.potencia_watts} W`}</span>}
            </div>
            <div className="quote-actions">
              <Button type="submit" variant="primary" icon={Calculator} loading={calculating} disabled={loading || machines.length === 0 || materials.length === 0}>Calcular cotizacion</Button>
            </div>
          </form>
        </section>

        <section className="quote-result-section" aria-labelledby="quote-result-title">
          <div className="quote-section-heading">
            <div>
              <h2 id="quote-result-title">Resultado</h2>
              <p>Desglose calculado con las tarifas vigentes.</p>
            </div>
          </div>

          {result ? (
            <div className="quote-result" aria-live="polite">
              <div className="quote-total-band">
                <div>
                  <span>Precio sugerido</span>
                  <strong>{formatMoney(result.precio_sugerido)}</strong>
                </div>
                <div>
                  <span>Por pieza</span>
                  <strong>{formatMoney(result.precio_sugerido_por_pieza)}</strong>
                  <small>{result.cantidad_piezas} {result.cantidad_piezas === 1 ? 'pieza' : 'piezas'}</small>
                </div>
              </div>

              <dl className="quote-breakdown">
                <div><dt><Cube size={16} aria-hidden="true" />Material</dt><dd>{formatMoney(result.costo_material)}</dd></div>
                <div><dt><Printer size={16} aria-hidden="true" />Uso de maquina</dt><dd>{formatMoney(result.costo_maquina)}</dd></div>
                <div><dt><Lightning size={16} aria-hidden="true" />Electricidad</dt><dd>{formatMoney(result.costo_electrico)}</dd></div>
                <div><dt><Wrench size={16} aria-hidden="true" />Preparacion</dt><dd>{formatMoney(result.costo_preparacion)}</dd></div>
                <div className="quote-subtotal"><dt><Receipt size={16} aria-hidden="true" />Costo total</dt><dd>{formatMoney(result.subtotal)}</dd></div>
              </dl>
            </div>
          ) : (
            <div className="quote-empty">
              <Calculator size={28} aria-hidden="true" />
              <strong>{loading ? 'Cargando catalogos...' : 'Sin calculo todavia'}</strong>
              <span>Completa los datos del lote para obtener el desglose.</span>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
