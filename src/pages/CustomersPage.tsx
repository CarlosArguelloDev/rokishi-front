import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Badge } from '@cloudflare/kumo/components/badge'
import { Banner } from '@cloudflare/kumo/components/banner'
import { Button } from '@cloudflare/kumo/components/button'
import { Dialog } from '@cloudflare/kumo/components/dialog'
import { Input, Textarea } from '@cloudflare/kumo/components/input'
import { Select } from '@cloudflare/kumo/components/select'
import { Table } from '@cloudflare/kumo/components/table'
import { ArrowClockwise, Eye, FunnelSimple, PencilSimple, Plus, Power, Users } from '@phosphor-icons/react'
import { ApiError } from '../api/client'
import {
  createCustomer,
  listCustomers,
  type Customer,
  type CustomerFilters,
  type CustomerInput,
  updateCustomer,
} from '../api/customers'
import PageHeader from '../components/PageHeader'

type CustomerForm = {
  nombre: string
  correo: string
  telefono: string
  notas: string
}

type FilterForm = {
  q: string
  activo: string
}

const EMPTY_FORM: CustomerForm = { nombre: '', correo: '', telefono: '', notas: '' }
const EMPTY_FILTERS: FilterForm = { q: '', activo: '' }

function formFromCustomer(customer: Customer): CustomerForm {
  return {
    nombre: customer.nombre,
    correo: customer.correo ?? '',
    telefono: customer.telefono ?? '',
    notas: customer.notas ?? '',
  }
}

function sortCustomers(customers: Customer[]) {
  return [...customers].sort((a, b) => a.nombre.localeCompare(b.nombre) || a.id - b.id)
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filters, setFilters] = useState<FilterForm>(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<CustomerFilters>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [success, setSuccess] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [form, setForm] = useState<CustomerForm>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [details, setDetails] = useState<Customer | null>(null)
  const [togglingID, setTogglingID] = useState<number | null>(null)

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setLoadError('')
    try {
      setCustomers(sortCustomers(await listCustomers(appliedFilters, signal)))
    } catch (error) {
      if (!signal?.aborted) setLoadError(error instanceof ApiError ? error.message : 'No se pudieron cargar los clientes.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [appliedFilters])

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(() => { if (!controller.signal.aborted) void load(controller.signal) })
    return () => controller.abort()
  }, [load])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setFormOpen(true)
  }

  function openEdit(customer: Customer) {
    setEditing(customer)
    setForm(formFromCustomer(customer))
    setFormError('')
    setDetails(null)
    setFormOpen(true)
  }

  function updateField(field: keyof CustomerForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function applyFilters(event: FormEvent) {
    event.preventDefault()
    setAppliedFilters({
      q: filters.q || undefined,
      activo: filters.activo === '' ? undefined : filters.activo === 'true',
    })
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS)
    setAppliedFilters({})
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    if (!form.nombre.trim()) {
      setFormError('El nombre es obligatorio.')
      return
    }
    const input: CustomerInput = {
      nombre: form.nombre,
      correo: form.correo.trim() || null,
      telefono: form.telefono.trim() || null,
      notas: form.notas.trim() || null,
    }
    setSaving(true)
    setFormError('')
    try {
      const saved = editing ? await updateCustomer(editing.id, input) : await createCustomer(input)
      setCustomers((current) => sortCustomers(editing
        ? current.map((customer) => customer.id === saved.id ? saved : customer)
        : [...current, saved]))
      setSuccess(editing ? 'El cliente se actualizo correctamente.' : 'El cliente se registro correctamente.')
      setLoadError('')
      setFormOpen(false)
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'No se pudo guardar el cliente.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(customer: Customer) {
    setTogglingID(customer.id)
    setSuccess('')
    try {
      const updated = await updateCustomer(customer.id, { activo: !customer.activo })
      if (appliedFilters.activo !== undefined && appliedFilters.activo !== updated.activo) {
        setCustomers((current) => current.filter((item) => item.id !== updated.id))
      } else {
        setCustomers((current) => current.map((item) => item.id === updated.id ? updated : item))
      }
      setSuccess(`El cliente quedo ${updated.activo ? 'activo' : 'inactivo'}.`)
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : 'No se pudo cambiar el estado del cliente.')
    } finally {
      setTogglingID(null)
    }
  }

  return (
    <div>
      <PageHeader title="Clientes" description="Administra los clientes que reciben cotizaciones." action={<Button variant="primary" icon={Plus} onClick={openCreate}>Nuevo cliente</Button>} />

      <div className="feedback-stack" aria-live="polite">
        {success && <Banner title="Operacion completada" description={success} />}
        {loadError && <Banner variant="error" title="No fue posible completar la solicitud" description={loadError} />}
      </div>

      <form className="customer-filters" onSubmit={applyFilters} aria-label="Filtros de clientes">
        <div className="filter-control"><Input label="Buscar" value={filters.q} maxLength={100} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} /></div>
        <div className="filter-control"><Select label="Estado" placeholder="Todos" value={filters.activo} onValueChange={(value) => setFilters((current) => ({ ...current, activo: value ?? '' }))} items={[{ value: 'true', label: 'Activos' }, { value: 'false', label: 'Inactivos' }]} /></div>
        <div className="filter-actions"><Button type="button" variant="ghost" onClick={clearFilters}>Limpiar</Button><Button type="submit" variant="secondary" icon={FunnelSimple}>Aplicar</Button></div>
      </form>

      <section className="catalog-section" aria-label="Listado de clientes">
        {loading ? (
          <div className="catalog-state" role="status">Cargando clientes...</div>
        ) : loadError && customers.length === 0 ? (
          <div className="catalog-state"><strong>Los datos no estan disponibles</strong><Button variant="secondary" size="sm" icon={ArrowClockwise} onClick={() => void load()}>Reintentar</Button></div>
        ) : customers.length === 0 ? (
          <div className="catalog-state"><Users size={28} aria-hidden="true" /><strong>No hay clientes para mostrar</strong><span>Registra un cliente o ajusta los filtros.</span></div>
        ) : (
          <div className="table-scroll">
            <Table>
              <Table.Header><Table.Row><Table.Head>Cliente</Table.Head><Table.Head>Correo</Table.Head><Table.Head>Telefono</Table.Head><Table.Head>Estado</Table.Head><Table.Head><span className="sr-only">Acciones</span></Table.Head></Table.Row></Table.Header>
              <Table.Body>
                {customers.map((customer) => (
                  <Table.Row key={customer.id}>
                    <Table.Cell><strong>{customer.nombre}</strong></Table.Cell>
                    <Table.Cell>{customer.correo || 'Sin especificar'}</Table.Cell>
                    <Table.Cell>{customer.telefono || 'Sin especificar'}</Table.Cell>
                    <Table.Cell><Badge variant={customer.activo ? 'success' : 'neutral'} appearance="dot">{customer.activo ? 'Activo' : 'Inactivo'}</Badge></Table.Cell>
                    <Table.Cell><div className="row-actions"><Button variant="ghost" shape="square" size="sm" icon={Eye} aria-label={`Ver ${customer.nombre}`} onClick={() => setDetails(customer)} /><Button variant="ghost" shape="square" size="sm" icon={PencilSimple} aria-label={`Editar ${customer.nombre}`} onClick={() => openEdit(customer)} /><Button variant="ghost" shape="square" size="sm" icon={Power} loading={togglingID === customer.id} aria-label={`${customer.activo ? 'Desactivar' : 'Activar'} ${customer.nombre}`} onClick={() => void toggleActive(customer)} /></div></Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        )}
      </section>

      <Dialog.Root open={formOpen} onOpenChange={setFormOpen}>
        <Dialog size="lg" className="p-8">
          <Dialog.Title>{editing ? 'Editar cliente' : 'Nuevo cliente'}</Dialog.Title>
          <Dialog.Description>El nombre es obligatorio; los datos de contacto son opcionales.</Dialog.Description>
          <form className="catalog-form" onSubmit={submit}>
            {formError && <Banner size="sm" variant="error" title="Revisa la informacion" description={formError} />}
            <Input label="Nombre *" value={form.nombre} maxLength={100} onChange={(event) => updateField('nombre', event.target.value)} />
            <div className="form-grid">
              <Input label="Correo" type="email" value={form.correo} maxLength={254} onChange={(event) => updateField('correo', event.target.value)} />
              <Input label="Telefono" value={form.telefono} maxLength={30} onChange={(event) => updateField('telefono', event.target.value)} />
            </div>
            <div className="textarea-field"><label htmlFor="customer-notes">Notas</label><Textarea id="customer-notes" rows={3} value={form.notas} maxLength={2000} onChange={(event) => updateField('notas', event.target.value)} /></div>
            <div className="dialog-actions"><Dialog.Close render={(props) => <Button type="button" variant="ghost" {...props}>Cancelar</Button>} /><Button type="submit" variant="primary" loading={saving}>{editing ? 'Guardar cambios' : 'Registrar cliente'}</Button></div>
          </form>
        </Dialog>
      </Dialog.Root>

      <Dialog.Root open={details !== null} onOpenChange={(open) => { if (!open) setDetails(null) }}>
        <Dialog size="lg" className="p-8">
          <Dialog.Title>{details?.nombre ?? 'Detalle de cliente'}</Dialog.Title>
          <Dialog.Description>Informacion registrada para cotizaciones.</Dialog.Description>
          {details && <dl className="details-grid"><div><dt>Correo</dt><dd>{details.correo || 'Sin especificar'}</dd></div><div><dt>Telefono</dt><dd>{details.telefono || 'Sin especificar'}</dd></div><div><dt>Estado</dt><dd>{details.activo ? 'Activo' : 'Inactivo'}</dd></div><div><dt>Registro</dt><dd>{new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(details.fecha_creacion))}</dd></div><div className="details-wide"><dt>Notas</dt><dd>{details.notas || 'Sin notas'}</dd></div></dl>}
          <div className="dialog-actions"><Dialog.Close render={(props) => <Button variant="ghost" {...props}>Cerrar</Button>} />{details && <Button variant="primary" icon={PencilSimple} onClick={() => openEdit(details)}>Editar</Button>}</div>
        </Dialog>
      </Dialog.Root>
    </div>
  )
}
