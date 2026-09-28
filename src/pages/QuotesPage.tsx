import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Badge } from '@cloudflare/kumo/components/badge'
import { Banner } from '@cloudflare/kumo/components/banner'
import { Button } from '@cloudflare/kumo/components/button'
import { Dialog } from '@cloudflare/kumo/components/dialog'
import { Input, Textarea } from '@cloudflare/kumo/components/input'
import { Select } from '@cloudflare/kumo/components/select'
import { Table } from '@cloudflare/kumo/components/table'
import { ArrowClockwise, Calculator, DownloadSimple, Eye, FileText, FunnelSimple, Package, PaperPlaneTilt } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { listCustomers, type Customer } from '../api/customers'
import { createOrder } from '../api/production'
import {
  changeQuoteStatus,
  generateQuotePDF,
  getQuote,
  listQuotes,
  listQuoteStatuses,
  type Quote,
  type QuoteFilters,
  type QuoteStatus,
} from '../api/quotes'
import PageHeader from '../components/PageHeader'

type FilterForm = {
  customerID: string
  status: string
}

type PDFForm = {
  validityDays: string
  productionTime: string
  discountPercentage: string
  taxPercentage: string
  deposit: string
  balance: string
  paymentMethod: string
  specifications: string
}

const EMPTY_FILTERS: FilterForm = { customerID: '', status: '' }

function pdfFormForQuote(quote: Quote): PDFForm {
  let validityDays = 15
  if (quote.fecha_vencimiento) {
    const difference = new Date(quote.fecha_vencimiento).getTime() - new Date(quote.fecha_creacion).getTime()
    const calculated = Math.ceil(difference / 86_400_000)
    if (calculated >= 1 && calculated <= 365) validityDays = calculated
  }
  return {
    validityDays: String(validityDays),
    productionTime: '',
    discountPercentage: '0',
    taxPercentage: '16',
    deposit: '50 %',
    balance: 'Contra entrega',
    paymentMethod: 'Transferencia',
    specifications: '',
  }
}

const TRANSITIONS: Record<string, string[]> = {
  BORRADOR: ['ENVIADA', 'CANCELADA'],
  ENVIADA: ['ACEPTADA', 'RECHAZADA', 'VENCIDA', 'CANCELADA'],
}

const moneyFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
const dateFormatter = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' })

function quoteFilters(form: FilterForm): QuoteFilters {
  return {
    cliente_id: form.customerID ? Number(form.customerID) : undefined,
    estado: form.status || undefined,
  }
}

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : 'Sin vencimiento'
}

export default function QuotesPage() {
  const navigate = useNavigate()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [statuses, setStatuses] = useState<QuoteStatus[]>([])
  const [filters, setFilters] = useState<FilterForm>(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<QuoteFilters>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [success, setSuccess] = useState('')
  const [details, setDetails] = useState<Quote | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [targetStatus, setTargetStatus] = useState('')
  const [changingStatus, setChangingStatus] = useState(false)
  const [creatingOrder, setCreatingOrder] = useState(false)
  const [pdfQuote, setPDFQuote] = useState<Quote | null>(null)
  const [pdfForm, setPDFForm] = useState<PDFForm | null>(null)
  const [pdfError, setPDFError] = useState('')
  const [generatingPDF, setGeneratingPDF] = useState(false)

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setLoadError('')
    try {
      const [quoteData, customerData, statusData] = await Promise.all([
        listQuotes(appliedFilters, signal),
        listCustomers({}, signal),
        listQuoteStatuses(signal),
      ])
      setQuotes(quoteData)
      setCustomers(customerData)
      setStatuses(statusData)
    } catch (error) {
      if (!signal?.aborted) setLoadError(error instanceof ApiError ? error.message : 'No se pudieron cargar las cotizaciones.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [appliedFilters])

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(() => { if (!controller.signal.aborted) void load(controller.signal) })
    return () => controller.abort()
  }, [load])

  const nextStatuses = useMemo(() => {
    if (!details) return []
    const allowed = TRANSITIONS[details.estado_codigo] ?? []
    return statuses.filter((status) => allowed.includes(status.codigo))
  }, [details, statuses])

  function applyFilters(event: FormEvent) {
    event.preventDefault()
    setAppliedFilters(quoteFilters(filters))
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS)
    setAppliedFilters({})
  }

  async function openDetails(quote: Quote) {
    setDetails(quote)
    setTargetStatus(TRANSITIONS[quote.estado_codigo]?.[0] ?? '')
    setDetailsLoading(true)
    setDetailsError('')
    try {
      const loaded = await getQuote(quote.id)
      setDetails(loaded)
      setTargetStatus(TRANSITIONS[loaded.estado_codigo]?.[0] ?? '')
    } catch (error) {
      setDetailsError(error instanceof ApiError ? error.message : 'No se pudo cargar el desglose de la cotizacion.')
    } finally {
      setDetailsLoading(false)
    }
  }

  async function submitStatus(event: FormEvent) {
    event.preventDefault()
    if (!details || !targetStatus || changingStatus) return
    setChangingStatus(true)
    setDetailsError('')
    try {
      const updated = await changeQuoteStatus(details.id, targetStatus)
      const merged = { ...details, ...updated }
      setDetails(merged)
      setTargetStatus(TRANSITIONS[updated.estado_codigo]?.[0] ?? '')
      setQuotes((current) => current.map((quote) => quote.id === updated.id ? { ...quote, ...updated } : quote))
      setSuccess(`La cotizacion #${updated.id} cambio a ${updated.estado_nombre}.`)
    } catch (error) {
      setDetailsError(error instanceof ApiError ? error.message : 'No se pudo cambiar el estado.')
    } finally {
      setChangingStatus(false)
    }
  }

  async function submitOrder() {
    if (!details || details.estado_codigo !== 'ACEPTADA' || creatingOrder) return
    setCreatingOrder(true)
    setDetailsError('')
    try {
      const order = await createOrder(details.id)
      setDetails(null)
      navigate('/pedidos')
      setSuccess(`Pedido PED-${String(order.id).padStart(6, '0')} creado correctamente.`)
    } catch (error) {
      if (error instanceof ApiError && error.code === 'order_exists') {
        setDetails(null)
        navigate('/pedidos')
      } else {
        setDetailsError(error instanceof ApiError ? error.message : 'No se pudo crear el pedido.')
      }
    } finally {
      setCreatingOrder(false)
    }
  }

  function openPDFForm() {
    if (!details) return
    setPDFQuote(details)
    setPDFForm(pdfFormForQuote(details))
    setPDFError('')
    setDetails(null)
  }

  function updatePDFField<K extends keyof PDFForm>(field: K, value: PDFForm[K]) {
    setPDFForm((current) => current ? { ...current, [field]: value } : current)
  }

  async function submitPDF(event: FormEvent) {
    event.preventDefault()
    if (!pdfQuote || !pdfForm || generatingPDF) return
    setGeneratingPDF(true)
    setPDFError('')
    try {
      const blob = await generateQuotePDF(pdfQuote.id, {
        vigencia_dias: Number(pdfForm.validityDays),
        tiempo_produccion: pdfForm.productionTime,
        descuento_porcentaje: Number(pdfForm.discountPercentage),
        iva_porcentaje: Number(pdfForm.taxPercentage),
        anticipo: pdfForm.deposit,
        saldo: pdfForm.balance,
        forma_pago: pdfForm.paymentMethod,
        especificaciones: pdfForm.specifications,
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cotizacion-COT-${String(pdfQuote.id).padStart(6, '0')}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setSuccess(`PDF de la cotizacion COT-${String(pdfQuote.id).padStart(6, '0')} generado.`)
      setPDFQuote(null)
      setPDFForm(null)
    } catch (error) {
      setPDFError(error instanceof ApiError ? error.message : 'No se pudo generar el PDF.')
    } finally {
      setGeneratingPDF(false)
    }
  }

  const customerItems = customers.map((customer) => ({ value: String(customer.id), label: customer.nombre }))
  const statusItems = statuses.map((status) => ({ value: status.codigo, label: status.nombre }))
  const nextStatusItems = nextStatuses.map((status) => ({ value: status.codigo, label: status.nombre }))

  return (
    <div>
      <PageHeader title="Cotizaciones" description="Consulta propuestas guardadas y controla su estado comercial." action={<Button variant="primary" icon={Calculator} onClick={() => navigate('/cotizador')}>Nueva cotizacion</Button>} />

      <div className="feedback-stack" aria-live="polite">
        {success && <Banner title="Operacion completada" description={success} />}
        {loadError && <Banner variant="error" title="Cotizaciones no disponibles" description={loadError} />}
      </div>

      <form className="quote-filters" onSubmit={applyFilters} aria-label="Filtros de cotizaciones">
        <div className="filter-control"><Select label="Cliente" placeholder="Todos" value={filters.customerID} onValueChange={(value) => setFilters((current) => ({ ...current, customerID: value ?? '' }))} items={customerItems} /></div>
        <div className="filter-control"><Select label="Estado" placeholder="Todos" value={filters.status} onValueChange={(value) => setFilters((current) => ({ ...current, status: value ?? '' }))} items={statusItems} /></div>
        <div className="filter-actions"><Button type="button" variant="ghost" onClick={clearFilters}>Limpiar</Button><Button type="submit" variant="secondary" icon={FunnelSimple}>Aplicar</Button></div>
      </form>

      <section className="catalog-section" aria-label="Listado de cotizaciones">
        {loading ? (
          <div className="catalog-state" role="status">Cargando cotizaciones...</div>
        ) : loadError && quotes.length === 0 ? (
          <div className="catalog-state"><strong>Los datos no estan disponibles</strong><Button variant="secondary" size="sm" icon={ArrowClockwise} onClick={() => void load()}>Reintentar</Button></div>
        ) : quotes.length === 0 ? (
          <div className="catalog-state"><FileText size={28} aria-hidden="true" /><strong>No hay cotizaciones para mostrar</strong><span>Calcula y guarda la primera cotizacion.</span><Button variant="primary" size="sm" icon={Calculator} onClick={() => navigate('/cotizador')}>Abrir cotizador</Button></div>
        ) : (
          <div className="table-scroll">
            <Table>
              <Table.Header><Table.Row><Table.Head>Folio</Table.Head><Table.Head>Cliente</Table.Head><Table.Head>Estado</Table.Head><Table.Head>Precio sugerido</Table.Head><Table.Head>Creada</Table.Head><Table.Head>Vencimiento</Table.Head><Table.Head><span className="sr-only">Acciones</span></Table.Head></Table.Row></Table.Header>
              <Table.Body>
                {quotes.map((quote) => (
                  <Table.Row key={quote.id}>
                    <Table.Cell><code className="catalog-code">COT-{String(quote.id).padStart(6, '0')}</code></Table.Cell>
                    <Table.Cell><strong>{quote.cliente_nombre}</strong></Table.Cell>
                    <Table.Cell><Badge variant={quote.estado_codigo === 'ACEPTADA' ? 'success' : 'neutral'} appearance="dot">{quote.estado_nombre}</Badge></Table.Cell>
                    <Table.Cell>{moneyFormatter.format(quote.precio_sugerido_total)}</Table.Cell>
                    <Table.Cell>{dateFormatter.format(new Date(quote.fecha_creacion))}</Table.Cell>
                    <Table.Cell>{formatDate(quote.fecha_vencimiento)}</Table.Cell>
                    <Table.Cell><div className="row-actions"><Button variant="ghost" shape="square" size="sm" icon={Eye} aria-label={`Ver cotizacion ${quote.id}`} onClick={() => void openDetails(quote)} /></div></Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        )}
      </section>

      <Dialog.Root open={details !== null} onOpenChange={(open) => { if (!open) { setDetails(null); setDetailsError('') } }}>
        <Dialog size="lg" className="p-8">
          <Dialog.Title>{details ? `Cotizacion COT-${String(details.id).padStart(6, '0')}` : 'Detalle de cotizacion'}</Dialog.Title>
          <Dialog.Description>{details ? `${details.cliente_nombre} - ${details.estado_nombre}` : 'Desglose historico de costos.'}</Dialog.Description>
          {detailsError && <div className="feedback-stack"><Banner size="sm" variant="error" title="No fue posible completar la solicitud" description={detailsError} /></div>}
          {detailsLoading ? (
            <div className="catalog-state" role="status">Cargando desglose...</div>
          ) : details && (
            <div className="quote-detail">
              <dl className="details-grid">
                <div><dt>Costo total</dt><dd>{moneyFormatter.format(details.costo_total)}</dd></div>
                <div><dt>Precio sugerido</dt><dd><strong>{moneyFormatter.format(details.precio_sugerido_total)}</strong></dd></div>
                <div><dt>Creada</dt><dd>{formatDate(details.fecha_creacion)}</dd></div>
                <div><dt>Vencimiento</dt><dd>{formatDate(details.fecha_vencimiento)}</dd></div>
                <div className="details-wide"><dt>Notas</dt><dd>{details.notas || 'Sin notas'}</dd></div>
              </dl>
              <div className="quote-concepts">
                {(details.conceptos ?? []).map((concept, index) => (
                  <div className="quote-concept" key={concept.id}>
                    <div><strong>{concept.descripcion || `Concepto ${index + 1}`}</strong><span>{concept.maquina_codigo} - {concept.maquina_nombre}</span><span>{concept.material_nombre} / {concept.cantidad_material_gramos} g / {concept.duracion_minutos} min / {concept.cantidad_piezas} pzas.</span></div>
                    <div><span>Costo {moneyFormatter.format(concept.subtotal)}</span><strong>{moneyFormatter.format(concept.precio_sugerido)}</strong></div>
                  </div>
                ))}
              </div>
              {nextStatuses.length > 0 && <form className="quote-status-form" onSubmit={submitStatus}><Select label="Siguiente estado" value={targetStatus} onValueChange={(value) => setTargetStatus(value ?? '')} items={nextStatusItems} /><Button type="submit" variant="primary" icon={PaperPlaneTilt} loading={changingStatus} disabled={!targetStatus}>Actualizar estado</Button></form>}
            </div>
          )}
          <div className="dialog-actions"><Dialog.Close render={(props) => <Button variant="ghost" {...props}>Cerrar</Button>} />{details && <Button variant="secondary" icon={DownloadSimple} disabled={detailsLoading} onClick={openPDFForm}>Preparar PDF</Button>}{details?.estado_codigo === 'ACEPTADA' && <Button variant="primary" icon={Package} loading={creatingOrder} onClick={() => void submitOrder()}>Crear pedido</Button>}</div>
        </Dialog>
      </Dialog.Root>

      <Dialog.Root open={pdfQuote !== null} onOpenChange={(open) => { if (!open) { setPDFQuote(null); setPDFForm(null); setPDFError('') } }}>
        <Dialog size="lg" className="p-8">
          <Dialog.Title>Preparar cotizacion en PDF</Dialog.Title>
          <Dialog.Description>{pdfQuote ? `Completa solo las condiciones de esta entrega para ${pdfQuote.cliente_nombre}.` : 'Configura el documento.'}</Dialog.Description>
          {pdfForm && (
            <form className="catalog-form" onSubmit={submitPDF}>
              {pdfError && <Banner size="sm" variant="error" title="No se pudo generar el PDF" description={pdfError} />}
              <div className="form-grid">
                <Input label="Vigencia (dias) *" type="number" min="1" max="365" required value={pdfForm.validityDays} onChange={(event) => updatePDFField('validityDays', event.target.value)} />
                <Input label="Tiempo de produccion" maxLength={120} placeholder="Ej. 5 a 7 dias habiles" value={pdfForm.productionTime} onChange={(event) => updatePDFField('productionTime', event.target.value)} />
              </div>
              <div className="form-grid">
                <Input label="Descuento (%)" type="number" min="0" max="100" step="0.01" required value={pdfForm.discountPercentage} onChange={(event) => updatePDFField('discountPercentage', event.target.value)} />
                <Input label="IVA (%)" type="number" min="0" max="100" step="0.01" required value={pdfForm.taxPercentage} onChange={(event) => updatePDFField('taxPercentage', event.target.value)} />
              </div>
              <div className="form-grid">
                <Input label="Anticipo" maxLength={80} placeholder="Ej. 50 %" value={pdfForm.deposit} onChange={(event) => updatePDFField('deposit', event.target.value)} />
                <Input label="Saldo" maxLength={80} placeholder="Ej. Contra entrega" value={pdfForm.balance} onChange={(event) => updatePDFField('balance', event.target.value)} />
              </div>
              <Input label="Forma de pago" maxLength={80} value={pdfForm.paymentMethod} onChange={(event) => updatePDFField('paymentMethod', event.target.value)} />
              <div className="textarea-field"><label htmlFor="quote-pdf-specifications">Especificaciones adicionales</label><Textarea id="quote-pdf-specifications" rows={4} maxLength={1000} placeholder="Material, color, acabado, entrega u otras condiciones." value={pdfForm.specifications} onChange={(event) => updatePDFField('specifications', event.target.value)} /></div>
              <div className="dialog-actions"><Dialog.Close render={(props) => <Button type="button" variant="ghost" {...props}>Cancelar</Button>} /><Button type="submit" variant="primary" icon={DownloadSimple} loading={generatingPDF}>Generar y descargar</Button></div>
            </form>
          )}
        </Dialog>
      </Dialog.Root>
    </div>
  )
}
