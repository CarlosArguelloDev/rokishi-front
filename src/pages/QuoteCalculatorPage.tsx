import { type FormEvent, useEffect, useState } from 'react'
import { Banner } from '@cloudflare/kumo/components/banner'
import { Button } from '@cloudflare/kumo/components/button'
import { Dialog } from '@cloudflare/kumo/components/dialog'
import { Input, Textarea } from '@cloudflare/kumo/components/input'
import { Select } from '@cloudflare/kumo/components/select'
import { Calculator, Cube, FloppyDisk, Lightning, Printer, Receipt, Wrench } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { listMaterials, type Material } from '../api/costs'
import { listCustomers, type Customer } from '../api/customers'
import { listMachines, type Machine } from '../api/machines'
import { calculateQuote, createQuote, type QuoteCalculation } from '../api/quotes'
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
  const navigate = useNavigate()
  const [machines, setMachines] = useState<Machine[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [form, setForm] = useState<QuoteForm>(EMPTY_FORM)
  const [result, setResult] = useState<QuoteCalculation | null>(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [calculationError, setCalculationError] = useState('')
  const [saveOpen, setSaveOpen] = useState(false)
  const [customersLoading, setCustomersLoading] = useState(false)
  const [customerID, setCustomerID] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [savedQuoteID, setSavedQuoteID] = useState<number | null>(null)

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
    setSavedQuoteID(null)
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
      setSavedQuoteID(null)
    } catch (error) {
      setResult(null)
      setCalculationError(error instanceof ApiError ? error.message : 'No se pudo calcular la cotizacion.')
    } finally {
      setCalculating(false)
    }
  }

  async function openSave() {
    if (!result) return
    setSaveOpen(true)
    setSaveError('')
    setCustomersLoading(true)
    try {
      const customerData = await listCustomers({ activo: true })
      setCustomers(customerData)
      setCustomerID(customerData[0] ? String(customerData[0].id) : '')
      if (customerData.length === 0) setSaveError('Registra un cliente activo antes de guardar la cotizacion.')
    } catch (error) {
      setSaveError(error instanceof ApiError ? error.message : 'No se pudieron cargar los clientes.')
    } finally {
      setCustomersLoading(false)
    }
  }

  async function saveQuote(event: FormEvent) {
    event.preventDefault()
    if (!result || !customerID || saving) return
    setSaving(true)
    setSaveError('')
    try {
      const saved = await createQuote({
        cliente_id: Number(customerID),
        fecha_vencimiento: expirationDate ? new Date(`${expirationDate}T23:59:59`).toISOString() : null,
        notas: notes.trim() || null,
        conceptos: [{
          descripcion: description.trim() || null,
          maquina_id: result.maquina_id,
          material_id: result.material_id,
          cantidad_material_gramos: result.cantidad_material_gramos,
          duracion_minutos: result.duracion_minutos,
          cantidad_piezas: result.cantidad_piezas,
        }],
      })
      setSavedQuoteID(saved.id)
      setSaveOpen(false)
    } catch (error) {
      setSaveError(error instanceof ApiError ? error.message : 'No se pudo guardar la cotizacion.')
    } finally {
      setSaving(false)
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
  const customerItems = customers.map((customer) => ({ value: String(customer.id), label: customer.nombre }))
  const selectedMachine = machines.find((machine) => String(machine.id) === form.machineID)

  return (
    <div>
      <PageHeader title="Cotizador" description="Calcula el costo y precio sugerido de un lote de impresion." action={<span />} />

      <div className="feedback-stack" aria-live="polite">
        {loadError && <Banner variant="error" title="Catalogos no disponibles" description={loadError} />}
        {calculationError && <Banner variant="error" title="No se pudo calcular" description={calculationError} />}
        {savedQuoteID !== null && <Banner title="Cotizacion guardada" description={`Se creo la cotizacion COT-${String(savedQuoteID).padStart(6, '0')} como borrador.`} action={<Button variant="secondary" size="sm" onClick={() => navigate('/cotizaciones')}>Ver cotizaciones</Button>} />}
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
              <div className="quote-save-action"><Button variant="secondary" icon={FloppyDisk} onClick={() => void openSave()} disabled={savedQuoteID !== null}>{savedQuoteID !== null ? 'Cotizacion guardada' : 'Guardar cotizacion'}</Button></div>
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

      <Dialog.Root open={saveOpen} onOpenChange={setSaveOpen}>
        <Dialog size="lg" className="p-8">
          <Dialog.Title>Guardar cotizacion</Dialog.Title>
          <Dialog.Description>Se conservaran las tarifas y costos usados en este calculo.</Dialog.Description>
          <form className="catalog-form" onSubmit={saveQuote}>
            {saveError && <Banner size="sm" variant="error" title="No se puede guardar" description={saveError} />}
            <Select label="Cliente *" placeholder={customersLoading ? 'Cargando...' : 'Selecciona un cliente'} value={customerID} onValueChange={(value) => setCustomerID(value ?? '')} items={customerItems} disabled={customersLoading || customers.length === 0} />
            <div className="form-grid">
              <Input label="Descripcion del concepto" value={description} maxLength={200} onChange={(event) => setDescription(event.target.value)} />
              <Input label="Fecha de vencimiento" type="date" value={expirationDate} onChange={(event) => setExpirationDate(event.target.value)} />
            </div>
            <div className="textarea-field"><label htmlFor="quote-notes">Notas</label><Textarea id="quote-notes" rows={3} value={notes} maxLength={2000} onChange={(event) => setNotes(event.target.value)} /></div>
            <div className="dialog-actions"><Dialog.Close render={(props) => <Button type="button" variant="ghost" {...props}>Cancelar</Button>} /><Button type="submit" variant="primary" icon={FloppyDisk} loading={saving} disabled={!customerID || customersLoading}>Guardar borrador</Button></div>
          </form>
        </Dialog>
      </Dialog.Root>
    </div>
  )
}
