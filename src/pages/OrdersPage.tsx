import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Badge } from '@cloudflare/kumo/components/badge'
import { Banner } from '@cloudflare/kumo/components/banner'
import { Button } from '@cloudflare/kumo/components/button'
import { Dialog } from '@cloudflare/kumo/components/dialog'
import { Input, Textarea } from '@cloudflare/kumo/components/input'
import { Select } from '@cloudflare/kumo/components/select'
import { Table } from '@cloudflare/kumo/components/table'
import { ArrowClockwise, CheckCircle, Eye, FileText, FunnelSimple, Package, Play, Plus, Wrench } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { listCustomers, type Customer } from '../api/customers'
import { listMachines, type Machine } from '../api/machines'
import {
  assignWorkMachine,
  finishWork,
  getOrder,
  listOrders,
  startWork,
  type Order,
  type OrderFilters,
  type Work,
  type WorkAttempt,
} from '../api/production'
import DirectOrderDialog from '../components/DirectOrderDialog'
import PageHeader from '../components/PageHeader'

type FilterForm = { customerID: string; status: string }
type FinishForm = { result: 'EXITOSO' | 'FALLIDO'; consumed: string; waste: string; notes: string }

const EMPTY_FILTERS: FilterForm = { customerID: '', status: '' }
const EMPTY_FINISH: FinishForm = { result: 'EXITOSO', consumed: '', waste: '0', notes: '' }
const ORDER_STATUSES = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'EN_PRODUCCION', label: 'En produccion' },
  { value: 'COMPLETADO', label: 'Completado' },
  { value: 'CANCELADO', label: 'Cancelado' },
]

const dateFormatter = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' })

function statusLabel(status: string) {
  if (status === 'EN_PROCESO') return 'En proceso'
  return ORDER_STATUSES.find((item) => item.value === status)?.label ?? status
}

function statusVariant(status: string) {
  if (status === 'COMPLETADO') return 'success' as const
  if (status === 'EN_PRODUCCION' || status === 'EN_PROCESO') return 'warning' as const
  return 'neutral' as const
}

function originLabel(order: Order) {
  if (order.origen === 'PLATAFORMA') return order.plataforma_venta ?? 'Plataforma'
  return order.origen === 'EMPRESA' ? 'Empresa' : 'Cliente directo'
}

function formatDuration(seconds: number | null) {
  if (seconds === null) return 'En curso'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return minutes ? `${minutes} min ${remainingSeconds} s` : `${remainingSeconds} s`
}

function toFilters(form: FilterForm): OrderFilters {
  return {
    cliente_id: form.customerID ? Number(form.customerID) : undefined,
    estado: form.status || undefined,
  }
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [filters, setFilters] = useState<FilterForm>(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<OrderFilters>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [success, setSuccess] = useState('')
  const [details, setDetails] = useState<Order | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [assignments, setAssignments] = useState<Record<number, string>>({})
  const [workingID, setWorkingID] = useState<number | null>(null)
  const [finishTarget, setFinishTarget] = useState<Work | null>(null)
  const [finishForm, setFinishForm] = useState<FinishForm>(EMPTY_FINISH)
  const [finishError, setFinishError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setLoadError('')
    try {
      const [orderData, customerData] = await Promise.all([
        listOrders(appliedFilters, signal),
        listCustomers({}, signal),
      ])
      setOrders(orderData)
      setCustomers(customerData)
    } catch (error) {
      if (!signal?.aborted) setLoadError(error instanceof ApiError ? error.message : 'No se pudieron cargar los pedidos.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [appliedFilters])

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(() => { if (!controller.signal.aborted) void load(controller.signal) })
    return () => controller.abort()
  }, [load])

  async function openDetails(order: Order) {
    setDetails(order)
    setDetailsLoading(true)
    setDetailsError('')
    try {
      const [loaded, machineData] = await Promise.all([getOrder(order.id), listMachines({ activa: true })])
      setDetails(loaded)
      setMachines(machineData)
      setAssignments(Object.fromEntries((loaded.trabajos ?? []).map((work) => [work.id, work.maquina_id ? String(work.maquina_id) : ''])))
    } catch (error) {
      setDetailsError(error instanceof ApiError ? error.message : 'No se pudo cargar el pedido.')
    } finally {
      setDetailsLoading(false)
    }
  }

  async function refreshDetails(orderID: number) {
    const updated = await getOrder(orderID)
    setDetails(updated)
    setOrders((current) => current.map((order) => order.id === updated.id ? { ...order, ...updated, trabajos: undefined } : order))
    setAssignments(Object.fromEntries((updated.trabajos ?? []).map((work) => [work.id, work.maquina_id ? String(work.maquina_id) : ''])))
  }

  async function assignMachine(work: Work) {
    const machineID = Number(assignments[work.id])
    if (!machineID || workingID !== null) return
    setWorkingID(work.id)
    setDetailsError('')
    try {
      await assignWorkMachine(work.id, machineID)
      await refreshDetails(work.pedido_id)
      setSuccess(`Maquina asignada al trabajo #${work.id}.`)
    } catch (error) {
      setDetailsError(error instanceof ApiError ? error.message : 'No se pudo asignar la maquina.')
    } finally {
      setWorkingID(null)
    }
  }

  async function beginWork(work: Work) {
    if (workingID !== null) return
    setWorkingID(work.id)
    setDetailsError('')
    try {
      await startWork(work.id)
      await refreshDetails(work.pedido_id)
      setSuccess(`Trabajo #${work.id} iniciado.`)
    } catch (error) {
      setDetailsError(error instanceof ApiError ? error.message : 'No se pudo iniciar el trabajo.')
    } finally {
      setWorkingID(null)
    }
  }

  function openFinish(work: Work) {
    setFinishTarget(work)
    setFinishForm({ ...EMPTY_FINISH, consumed: String(work.material_estimado_gramos) })
    setFinishError('')
  }

  async function submitFinish(event: FormEvent) {
    event.preventDefault()
    if (!finishTarget || workingID !== null) return
    const consumed = Number(finishForm.consumed)
    const waste = Number(finishForm.waste)
    if (!Number.isFinite(consumed) || !Number.isFinite(waste) || consumed < 0 || waste < 0) {
      setFinishError('El consumo y el desperdicio deben ser numeros mayores o iguales a cero.')
      return
    }
    setWorkingID(finishTarget.id)
    setFinishError('')
    try {
      await finishWork(finishTarget.id, {
        resultado: finishForm.result,
        material_consumido_gramos: consumed,
        desperdicio_gramos: waste,
        notas: finishForm.notes.trim() || null,
      })
      await refreshDetails(finishTarget.pedido_id)
      setFinishTarget(null)
      setSuccess(finishForm.result === 'EXITOSO' ? `Trabajo #${finishTarget.id} completado.` : `Fallo registrado en el trabajo #${finishTarget.id}; ya puede reintentarse.`)
    } catch (error) {
      setFinishError(error instanceof ApiError ? error.message : 'No se pudo finalizar el trabajo.')
    } finally {
      setWorkingID(null)
    }
  }

  function applyFilters(event: FormEvent) {
    event.preventDefault()
    setAppliedFilters(toFilters(filters))
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS)
    setAppliedFilters({})
  }

  async function handleCreated(order: Order) {
    setCreateOpen(false)
    setSuccess(`Pedido PED-${String(order.id).padStart(6, '0')} creado correctamente.`)
    await load()
    await openDetails(order)
  }

  const customerItems = customers.map((customer) => ({ value: String(customer.id), label: customer.nombre }))

  return (
    <div>
      <PageHeader title="Pedidos" description="Registra pedidos y controla la ejecucion real de cada trabajo." action={<Button variant="primary" icon={Plus} onClick={() => setCreateOpen(true)}>Nuevo pedido</Button>} />

      <div className="feedback-stack" aria-live="polite">
        {success && <Banner title="Operacion completada" description={success} />}
        {loadError && <Banner variant="error" title="Pedidos no disponibles" description={loadError} />}
      </div>

      <form className="order-filters" onSubmit={applyFilters} aria-label="Filtros de pedidos">
        <div className="filter-control"><Select label="Cliente" placeholder="Todos" value={filters.customerID} onValueChange={(value) => setFilters((current) => ({ ...current, customerID: value ?? '' }))} items={customerItems} /></div>
        <div className="filter-control"><Select label="Estado" placeholder="Todos" value={filters.status} onValueChange={(value) => setFilters((current) => ({ ...current, status: value ?? '' }))} items={ORDER_STATUSES} /></div>
        <div className="filter-actions"><Button type="button" variant="ghost" onClick={clearFilters}>Limpiar</Button><Button type="submit" variant="secondary" icon={FunnelSimple}>Aplicar</Button></div>
      </form>

      <section className="catalog-section" aria-label="Listado de pedidos">
        {loading ? (
          <div className="catalog-state" role="status">Cargando pedidos...</div>
        ) : loadError && orders.length === 0 ? (
          <div className="catalog-state"><strong>Los datos no estan disponibles</strong><Button variant="secondary" size="sm" icon={ArrowClockwise} onClick={() => void load()}>Reintentar</Button></div>
        ) : orders.length === 0 ? (
          <div className="catalog-state"><Package size={28} aria-hidden="true" /><strong>No hay pedidos para mostrar</strong><span>Crea un pedido directo o convierte una cotizacion aceptada.</span><Button variant="primary" size="sm" icon={Plus} onClick={() => setCreateOpen(true)}>Nuevo pedido</Button><Button variant="secondary" size="sm" icon={FileText} onClick={() => navigate('/cotizaciones')}>Abrir cotizaciones</Button></div>
        ) : (
          <div className="table-scroll">
            <Table>
              <Table.Header><Table.Row><Table.Head>Pedido</Table.Head><Table.Head>Origen</Table.Head><Table.Head>Cliente</Table.Head><Table.Head>Estado</Table.Head><Table.Head>Avance</Table.Head><Table.Head>Creado</Table.Head><Table.Head><span className="sr-only">Acciones</span></Table.Head></Table.Row></Table.Header>
              <Table.Body>{orders.map((order) => <Table.Row key={order.id}><Table.Cell><code className="catalog-code">PED-{String(order.id).padStart(6, '0')}</code></Table.Cell><Table.Cell>{originLabel(order)}</Table.Cell><Table.Cell><strong>{order.cliente_nombre}</strong><br /><span className="table-secondary">{order.cliente_tipo === 'EMPRESA' ? 'Empresa' : 'Persona'}</span></Table.Cell><Table.Cell><Badge variant={statusVariant(order.estado)} appearance="dot">{statusLabel(order.estado)}</Badge></Table.Cell><Table.Cell>{order.trabajos_completados} / {order.cantidad_trabajos}</Table.Cell><Table.Cell>{dateFormatter.format(new Date(order.fecha_creacion))}</Table.Cell><Table.Cell><div className="row-actions"><Button variant="ghost" shape="square" size="sm" icon={Eye} aria-label={`Ver pedido ${order.id}`} onClick={() => void openDetails(order)} /></div></Table.Cell></Table.Row>)}</Table.Body>
            </Table>
          </div>
        )}
      </section>

      <Dialog.Root open={details !== null} onOpenChange={(open) => { if (!open) { setDetails(null); setDetailsError('') } }}>
        <Dialog size="lg" className="p-8">
          <Dialog.Title>{details ? `Pedido PED-${String(details.id).padStart(6, '0')}` : 'Detalle de pedido'}</Dialog.Title>
          <Dialog.Description>{details ? `${details.cliente_nombre} - ${statusLabel(details.estado)}` : 'Trabajos de produccion.'}</Dialog.Description>
          {detailsError && <div className="feedback-stack"><Banner size="sm" variant="error" title="No fue posible completar la solicitud" description={detailsError} /></div>}
          {detailsLoading ? <div className="catalog-state" role="status">Cargando trabajos...</div> : details && <div className="production-detail">
            <div className="production-summary"><span>{details.cotizacion_id ? `Cotizacion COT-${String(details.cotizacion_id).padStart(6, '0')}` : `Origen: ${originLabel(details)}`}</span><strong>{details.trabajos_completados} de {details.cantidad_trabajos} trabajos completados</strong></div>
            {details.notas && <p className="production-notes">{details.notas}</p>}
            <div className="production-works">{(details.trabajos ?? []).map((work, index) => {
              const compatibleMachines = machines.filter((machine) => machine.tipo_maquina_id === work.tipo_maquina_id_requerido)
              const machineItems = compatibleMachines.map((machine) => ({ value: String(machine.id), label: `${machine.codigo} - ${machine.nombre}` }))
              return <section className="production-work" key={work.id} aria-label={`Trabajo ${index + 1}`}>
                <div className="production-work-heading"><div><strong>{work.descripcion || `Trabajo ${index + 1}`}</strong><span>{work.material_nombre} / {work.material_estimado_gramos} g / {work.duracion_estimada_minutos} min / {work.cantidad_piezas} pzas.</span></div><Badge variant={statusVariant(work.estado)} appearance="dot">{statusLabel(work.estado)}</Badge></div>
                <div className="production-machine"><div><span className="state-label">Tipo requerido</span><strong>{work.tipo_maquina_requerido}</strong></div>{work.estado === 'PENDIENTE' ? <div className="production-assignment"><Select label="Maquina asignada" placeholder="Selecciona una maquina" value={assignments[work.id] ?? ''} onValueChange={(value) => setAssignments((current) => ({ ...current, [work.id]: value ?? '' }))} items={machineItems} /><Button type="button" variant="secondary" icon={Wrench} loading={workingID === work.id} disabled={!assignments[work.id] || workingID !== null} onClick={() => void assignMachine(work)}>Asignar</Button></div> : <div><span className="state-label">Maquina</span><strong>{work.maquina_codigo} - {work.maquina_nombre}</strong></div>}</div>
                <div className="production-attempts">{(work.intentos ?? []).length === 0 ? <span>Sin intentos registrados.</span> : (work.intentos ?? []).map((attempt) => <AttemptRow key={attempt.id} attempt={attempt} />)}</div>
                <div className="production-actions">{work.estado === 'PENDIENTE' && <Button variant="primary" icon={Play} loading={workingID === work.id} disabled={!work.maquina_id || workingID !== null} onClick={() => void beginWork(work)}>{(work.intentos ?? []).length ? 'Iniciar reimpresion' : 'Iniciar trabajo'}</Button>}{work.estado === 'EN_PROCESO' && <Button variant="primary" icon={CheckCircle} disabled={workingID !== null} onClick={() => openFinish(work)}>Registrar resultado</Button>}</div>
              </section>
            })}</div>
          </div>}
          <div className="dialog-actions"><Dialog.Close render={(props) => <Button variant="ghost" {...props}>Cerrar</Button>} /></div>
        </Dialog>
      </Dialog.Root>

      <DirectOrderDialog open={createOpen} customers={customers} onOpenChange={setCreateOpen} onCreated={handleCreated} />

      <Dialog.Root open={finishTarget !== null} onOpenChange={(open) => { if (!open) setFinishTarget(null) }}>
        <Dialog size="base" className="p-8">
          <Dialog.Title>Registrar resultado</Dialog.Title>
          <Dialog.Description>{finishTarget?.descripcion || (finishTarget ? `Trabajo #${finishTarget.id}` : 'Trabajo en proceso')}</Dialog.Description>
          <form className="catalog-form" onSubmit={submitFinish}>
            {finishError && <Banner size="sm" variant="error" title="No se pudo finalizar" description={finishError} />}
            <Select label="Resultado *" value={finishForm.result} onValueChange={(value) => setFinishForm((current) => ({ ...current, result: (value ?? 'EXITOSO') as FinishForm['result'] }))} items={[{ value: 'EXITOSO', label: 'Exitoso' }, { value: 'FALLIDO', label: 'Fallido' }]} />
            <div className="form-grid"><Input label="Material consumido (g) *" type="number" min="0" step="0.001" value={finishForm.consumed} onChange={(event) => setFinishForm((current) => ({ ...current, consumed: event.target.value }))} /><Input label="Desperdicio (g) *" type="number" min="0" step="0.001" value={finishForm.waste} onChange={(event) => setFinishForm((current) => ({ ...current, waste: event.target.value }))} /></div>
            <div className="textarea-field"><label htmlFor="finish-notes">Notas</label><Textarea id="finish-notes" rows={3} maxLength={2000} value={finishForm.notes} onChange={(event) => setFinishForm((current) => ({ ...current, notes: event.target.value }))} /></div>
            <div className="dialog-actions"><Dialog.Close render={(props) => <Button type="button" variant="ghost" {...props}>Cancelar</Button>} /><Button type="submit" variant="primary" loading={finishTarget ? workingID === finishTarget.id : false}>Guardar resultado</Button></div>
          </form>
        </Dialog>
      </Dialog.Root>
    </div>
  )
}

function AttemptRow({ attempt }: { attempt: WorkAttempt }) {
  return <div className="production-attempt"><div><strong>Intento {attempt.numero_intento}</strong><span>{attempt.maquina_codigo} - {attempt.maquina_nombre}</span></div><div><Badge variant={attempt.resultado === 'EXITOSO' ? 'success' : attempt.resultado === 'FALLIDO' ? 'error' : 'warning'}>{attempt.resultado === 'EXITOSO' ? 'Exitoso' : attempt.resultado === 'FALLIDO' ? 'Fallido' : 'En curso'}</Badge><span>{formatDuration(attempt.duracion_real_segundos)}</span></div>{attempt.fecha_fin && <div><span>Consumido {attempt.material_consumido_gramos ?? 0} g</span><span>Desperdicio {attempt.desperdicio_gramos ?? 0} g</span></div>}</div>
}
