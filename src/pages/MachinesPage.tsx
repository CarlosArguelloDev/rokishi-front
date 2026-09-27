import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Badge } from '@cloudflare/kumo/components/badge'
import { Banner } from '@cloudflare/kumo/components/banner'
import { Button } from '@cloudflare/kumo/components/button'
import { Dialog } from '@cloudflare/kumo/components/dialog'
import { Input } from '@cloudflare/kumo/components/input'
import { Select } from '@cloudflare/kumo/components/select'
import { Table } from '@cloudflare/kumo/components/table'
import { ArrowClockwise, Eye, FunnelSimple, MagnifyingGlass, PencilSimple, Plus, Power, Printer } from '@phosphor-icons/react'
import { listLocations, listMachineTypes, type Location, type MachineType } from '../api/catalogs'
import { ApiError } from '../api/client'
import {
  createMachine,
  listMachines,
  type Machine,
  type MachineFilters,
  type MachineInput,
  updateMachine,
} from '../api/machines'
import PageHeader from '../components/PageHeader'

type MachineForm = {
  locacion_id: string
  tipo_maquina_id: string
  codigo: string
  nombre: string
  marca: string
  modelo: string
  numero_serie: string
  potencia_watts: string
  fecha_compra: string
}

type FilterForm = {
  q: string
  locacion_id: string
  tipo_maquina_id: string
  activa: string
}

const EMPTY_FORM: MachineForm = {
  locacion_id: '',
  tipo_maquina_id: '',
  codigo: '',
  nombre: '',
  marca: '',
  modelo: '',
  numero_serie: '',
  potencia_watts: '',
  fecha_compra: '',
}

const EMPTY_FILTERS: FilterForm = {
  q: '',
  locacion_id: '',
  tipo_maquina_id: '',
  activa: '',
}

function formFromMachine(machine: Machine): MachineForm {
  return {
    locacion_id: String(machine.locacion_id),
    tipo_maquina_id: String(machine.tipo_maquina_id),
    codigo: machine.codigo,
    nombre: machine.nombre,
    marca: machine.marca ?? '',
    modelo: machine.modelo ?? '',
    numero_serie: machine.numero_serie ?? '',
    potencia_watts: machine.potencia_watts === null ? '' : String(machine.potencia_watts),
    fecha_compra: machine.fecha_compra ?? '',
  }
}

function toFilters(form: FilterForm): MachineFilters {
  return {
    q: form.q || undefined,
    locacion_id: form.locacion_id ? Number(form.locacion_id) : undefined,
    tipo_maquina_id: form.tipo_maquina_id ? Number(form.tipo_maquina_id) : undefined,
    activa: form.activa === '' ? undefined : form.activa === 'true',
  }
}

function sortMachines(machines: Machine[]) {
  return [...machines].sort((a, b) => a.nombre.localeCompare(b.nombre) || a.id - b.id)
}

function nullable(value: string) {
  return value.trim() || null
}

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [machineTypes, setMachineTypes] = useState<MachineType[]>([])
  const [filters, setFilters] = useState<FilterForm>(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<MachineFilters>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [success, setSuccess] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Machine | null>(null)
  const [form, setForm] = useState<MachineForm>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [details, setDetails] = useState<Machine | null>(null)
  const [togglingID, setTogglingID] = useState<number | null>(null)

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setLoadError('')
    try {
      const [machineData, locationData, typeData] = await Promise.all([
        listMachines(appliedFilters, signal),
        listLocations(signal),
        listMachineTypes(signal),
      ])
      setMachines(sortMachines(machineData))
      setLocations(locationData)
      setMachineTypes(typeData)
    } catch (error) {
      if (!signal?.aborted) {
        setLoadError(error instanceof ApiError ? error.message : 'No se pudieron cargar las maquinas.')
      }
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [appliedFilters])

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(() => {
      if (!controller.signal.aborted) void load(controller.signal)
    })
    return () => controller.abort()
  }, [load])

  function updateFilter(field: keyof FilterForm, value: string) {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  function applyFilters(event: FormEvent) {
    event.preventDefault()
    setAppliedFilters(toFilters(filters))
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS)
    setAppliedFilters({})
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setFormOpen(true)
  }

  function openEdit(machine: Machine) {
    setEditing(machine)
    setForm(formFromMachine(machine))
    setFormError('')
    setDetails(null)
    setFormOpen(true)
  }

  function updateField(field: keyof MachineForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    if (!form.locacion_id || !form.tipo_maquina_id || !form.codigo.trim() || !form.nombre.trim()) {
      setFormError('Locacion, tipo de maquina, codigo y nombre son obligatorios.')
      return
    }
    const power = form.potencia_watts === '' ? null : Number(form.potencia_watts)
    if (power !== null && (!Number.isFinite(power) || power < 0)) {
      setFormError('La potencia debe ser un numero mayor o igual a cero.')
      return
    }
    const input: MachineInput = {
      locacion_id: Number(form.locacion_id),
      tipo_maquina_id: Number(form.tipo_maquina_id),
      codigo: form.codigo,
      nombre: form.nombre,
      marca: nullable(form.marca),
      modelo: nullable(form.modelo),
      numero_serie: nullable(form.numero_serie),
      potencia_watts: power,
      fecha_compra: form.fecha_compra || null,
    }
    setSaving(true)
    setFormError('')
    try {
      const saved = editing ? await updateMachine(editing.id, input) : await createMachine(input)
      setMachines((current) => sortMachines(
        editing ? current.map((machine) => machine.id === saved.id ? saved : machine) : [...current, saved],
      ))
      setSuccess(editing ? 'La maquina se actualizo correctamente.' : 'La maquina se registro correctamente.')
      setLoadError('')
      setFormOpen(false)
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'No se pudo guardar la maquina.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(machine: Machine) {
    setTogglingID(machine.id)
    setSuccess('')
    setLoadError('')
    try {
      const updated = await updateMachine(machine.id, { activa: !machine.activa })
      if (appliedFilters.activa !== undefined && appliedFilters.activa !== updated.activa) {
        setMachines((current) => current.filter((item) => item.id !== updated.id))
      } else {
        setMachines((current) => current.map((item) => item.id === updated.id ? updated : item))
      }
      setSuccess(`La maquina quedo ${updated.activa ? 'activa' : 'inactiva'}.`)
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : 'No se pudo cambiar el estado.')
    } finally {
      setTogglingID(null)
    }
  }

  const locationItems = locations.map((location) => ({ value: String(location.id), label: `${location.codigo} - ${location.nombre}` }))
  const typeItems = machineTypes.map((type) => ({ value: String(type.id), label: type.nombre }))

  return (
    <div>
      <PageHeader
        title="Maquinas"
        description="Registra y administra el equipo disponible en cada locacion."
        action={<Button variant="primary" icon={Plus} onClick={openCreate}>Nueva maquina</Button>}
      />

      <div className="feedback-stack" aria-live="polite">
        {success && <Banner title="Operacion completada" description={success} />}
        {loadError && <Banner variant="error" title="No fue posible completar la solicitud" description={loadError} />}
      </div>

      <form className="machine-filters" onSubmit={applyFilters} aria-label="Filtros de maquinas">
        <Input label="Buscar" placeholder="Codigo o nombre" value={filters.q} maxLength={100} onChange={(event) => updateFilter('q', event.target.value)} />
        <Select label="Locacion" placeholder="Todas" value={filters.locacion_id} onValueChange={(value) => updateFilter('locacion_id', value ?? '')} items={locationItems} />
        <Select label="Tipo" placeholder="Todos" value={filters.tipo_maquina_id} onValueChange={(value) => updateFilter('tipo_maquina_id', value ?? '')} items={typeItems} />
        <Select
          label="Estado"
          placeholder="Todos"
          value={filters.activa}
          onValueChange={(value) => updateFilter('activa', value ?? '')}
          items={[{ value: 'true', label: 'Activas' }, { value: 'false', label: 'Inactivas' }]}
        />
        <div className="filter-actions">
          <Button type="button" variant="ghost" onClick={clearFilters}>Limpiar</Button>
          <Button type="submit" variant="secondary" icon={FunnelSimple}>Aplicar</Button>
        </div>
      </form>

      <section className="catalog-section" aria-label="Listado de maquinas">
        {loading ? (
          <div className="catalog-state" role="status">Cargando maquinas...</div>
        ) : loadError && machines.length === 0 ? (
          <div className="catalog-state">
            <strong>Los datos no estan disponibles</strong>
            <span>Restablece la conexion con la API para consultar las maquinas.</span>
            <Button variant="secondary" size="sm" icon={ArrowClockwise} onClick={() => void load()}>Reintentar</Button>
          </div>
        ) : machines.length === 0 ? (
          <div className="catalog-state">
            {Object.keys(appliedFilters).length ? <MagnifyingGlass size={28} aria-hidden="true" /> : <Printer size={28} aria-hidden="true" />}
            <strong>{Object.keys(appliedFilters).length ? 'No hay coincidencias' : 'No hay maquinas registradas'}</strong>
            <span>{Object.keys(appliedFilters).length ? 'Ajusta los filtros para ampliar la busqueda.' : 'Registra la primera maquina para comenzar.'}</span>
          </div>
        ) : (
          <div className="table-scroll">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Codigo</Table.Head>
                  <Table.Head>Nombre</Table.Head>
                  <Table.Head>Locacion</Table.Head>
                  <Table.Head>Tipo</Table.Head>
                  <Table.Head>Estado</Table.Head>
                  <Table.Head><span className="sr-only">Acciones</span></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {machines.map((machine) => (
                  <Table.Row key={machine.id}>
                    <Table.Cell><code className="catalog-code">{machine.codigo}</code></Table.Cell>
                    <Table.Cell><strong>{machine.nombre}</strong></Table.Cell>
                    <Table.Cell>{machine.locacion_nombre}</Table.Cell>
                    <Table.Cell>{machine.tipo_maquina_nombre}</Table.Cell>
                    <Table.Cell><Badge variant={machine.activa ? 'success' : 'neutral'} appearance="dot">{machine.activa ? 'Activa' : 'Inactiva'}</Badge></Table.Cell>
                    <Table.Cell>
                      <div className="row-actions">
                        <Button variant="ghost" shape="square" size="sm" icon={Eye} aria-label={`Ver ${machine.nombre}`} onClick={() => setDetails(machine)} />
                        <Button variant="ghost" shape="square" size="sm" icon={PencilSimple} aria-label={`Editar ${machine.nombre}`} onClick={() => openEdit(machine)} />
                        <Button variant="ghost" shape="square" size="sm" icon={Power} loading={togglingID === machine.id} aria-label={`${machine.activa ? 'Desactivar' : 'Activar'} ${machine.nombre}`} onClick={() => void toggleActive(machine)} />
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        )}
      </section>

      <Dialog.Root open={formOpen} onOpenChange={setFormOpen}>
        <Dialog size="lg" className="p-8 machine-dialog">
          <Dialog.Title>{editing ? 'Editar maquina' : 'Nueva maquina'}</Dialog.Title>
          <Dialog.Description>Los campos marcados son obligatorios.</Dialog.Description>
          <form className="catalog-form" onSubmit={submit}>
            {formError && <Banner size="sm" variant="error" title="Revisa la informacion" description={formError} />}
            <div className="form-grid">
              <Select label="Locacion *" placeholder="Selecciona una locacion" value={form.locacion_id} onValueChange={(value) => updateField('locacion_id', value ?? '')} items={locationItems} />
              <Select label="Tipo de maquina *" placeholder="Selecciona un tipo" value={form.tipo_maquina_id} onValueChange={(value) => updateField('tipo_maquina_id', value ?? '')} items={typeItems} />
              <Input label="Codigo *" value={form.codigo} maxLength={30} onChange={(event) => updateField('codigo', event.target.value)} />
              <Input label="Nombre *" value={form.nombre} maxLength={100} onChange={(event) => updateField('nombre', event.target.value)} />
              <Input label="Marca" value={form.marca} maxLength={100} onChange={(event) => updateField('marca', event.target.value)} />
              <Input label="Modelo" value={form.modelo} maxLength={100} onChange={(event) => updateField('modelo', event.target.value)} />
              <Input label="Numero de serie" value={form.numero_serie} maxLength={100} onChange={(event) => updateField('numero_serie', event.target.value)} />
              <Input label="Potencia (W)" type="number" min="0" step="0.01" value={form.potencia_watts} onChange={(event) => updateField('potencia_watts', event.target.value)} />
              <Input label="Fecha de compra" type="date" value={form.fecha_compra} onChange={(event) => updateField('fecha_compra', event.target.value)} />
            </div>
            <div className="dialog-actions">
              <Dialog.Close render={(props) => <Button type="button" variant="ghost" {...props}>Cancelar</Button>} />
              <Button type="submit" variant="primary" loading={saving}>{editing ? 'Guardar cambios' : 'Registrar maquina'}</Button>
            </div>
          </form>
        </Dialog>
      </Dialog.Root>

      <Dialog.Root open={details !== null} onOpenChange={(open) => { if (!open) setDetails(null) }}>
        <Dialog size="lg" className="p-8">
          <Dialog.Title>{details?.nombre ?? 'Detalle de maquina'}</Dialog.Title>
          <Dialog.Description>Informacion registrada para este equipo.</Dialog.Description>
          {details && (
            <dl className="details-grid">
              <div><dt>Codigo</dt><dd>{details.codigo}</dd></div>
              <div><dt>Estado</dt><dd>{details.activa ? 'Activa' : 'Inactiva'}</dd></div>
              <div><dt>Locacion</dt><dd>{details.locacion_codigo} - {details.locacion_nombre}</dd></div>
              <div><dt>Tipo</dt><dd>{details.tipo_maquina_nombre}</dd></div>
              <div><dt>Marca</dt><dd>{details.marca || 'Sin especificar'}</dd></div>
              <div><dt>Modelo</dt><dd>{details.modelo || 'Sin especificar'}</dd></div>
              <div><dt>Numero de serie</dt><dd>{details.numero_serie || 'Sin especificar'}</dd></div>
              <div><dt>Potencia</dt><dd>{details.potencia_watts === null ? 'Sin especificar' : `${details.potencia_watts} W`}</dd></div>
              <div><dt>Fecha de compra</dt><dd>{details.fecha_compra || 'Sin especificar'}</dd></div>
              <div><dt>Registrada</dt><dd>{new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(details.fecha_creacion))}</dd></div>
            </dl>
          )}
          <div className="dialog-actions">
            <Dialog.Close render={(props) => <Button variant="ghost" {...props}>Cerrar</Button>} />
            {details && <Button variant="primary" icon={PencilSimple} onClick={() => openEdit(details)}>Editar</Button>}
          </div>
        </Dialog>
      </Dialog.Root>
    </div>
  )
}
