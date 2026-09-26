import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Badge } from '@cloudflare/kumo/components/badge'
import { Banner } from '@cloudflare/kumo/components/banner'
import { Button } from '@cloudflare/kumo/components/button'
import { Dialog } from '@cloudflare/kumo/components/dialog'
import { Input, Textarea } from '@cloudflare/kumo/components/input'
import { Table } from '@cloudflare/kumo/components/table'
import { ArrowClockwise, Eye, MapPin, PencilSimple, Plus, Power } from '@phosphor-icons/react'
import {
  createLocation,
  listLocations,
  type Location,
  type LocationInput,
  updateLocation,
} from '../api/catalogs'
import { ApiError } from '../api/client'
import PageHeader from '../components/PageHeader'

type LocationForm = {
  codigo: string
  nombre: string
  direccion: string
  ciudad: string
  estado: string
  zona_horaria: string
}

const EMPTY_FORM: LocationForm = {
  codigo: '',
  nombre: '',
  direccion: '',
  ciudad: '',
  estado: '',
  zona_horaria: 'America/Mexico_City',
}

function formFromLocation(location: Location): LocationForm {
  return {
    codigo: location.codigo,
    nombre: location.nombre,
    direccion: location.direccion ?? '',
    ciudad: location.ciudad ?? '',
    estado: location.estado ?? '',
    zona_horaria: location.zona_horaria,
  }
}

function sortLocations(locations: Location[]) {
  return [...locations].sort((a, b) => a.nombre.localeCompare(b.nombre) || a.id - b.id)
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [success, setSuccess] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Location | null>(null)
  const [form, setForm] = useState<LocationForm>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [details, setDetails] = useState<Location | null>(null)
  const [togglingID, setTogglingID] = useState<number | null>(null)

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setLoadError('')
    try {
      setLocations(await listLocations(signal))
    } catch (error) {
      if (!signal?.aborted) {
        setLoadError(error instanceof ApiError ? error.message : 'No se pudieron cargar las locaciones.')
      }
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(() => {
      if (!controller.signal.aborted) void load(controller.signal)
    })
    return () => controller.abort()
  }, [load])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setFormOpen(true)
  }

  function openEdit(location: Location) {
    setEditing(location)
    setForm(formFromLocation(location))
    setFormError('')
    setDetails(null)
    setFormOpen(true)
  }

  function updateField(field: keyof LocationForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    if (!form.codigo.trim() || !form.nombre.trim() || !form.zona_horaria.trim()) {
      setFormError('Codigo, nombre y zona horaria son obligatorios.')
      return
    }
    setSaving(true)
    setFormError('')
    const input: LocationInput = {
      codigo: form.codigo,
      nombre: form.nombre,
      direccion: form.direccion || null,
      ciudad: form.ciudad || null,
      estado: form.estado || null,
      zona_horaria: form.zona_horaria,
    }
    try {
      const saved = editing
        ? await updateLocation(editing.id, input)
        : await createLocation(input)
      setLocations((current) => sortLocations(
        editing ? current.map((location) => location.id === saved.id ? saved : location) : [...current, saved],
      ))
      setLoadError('')
      setSuccess(editing ? 'La locacion se actualizo correctamente.' : 'La locacion se creo correctamente.')
      setFormOpen(false)
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'No se pudo guardar la locacion.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(location: Location) {
    setTogglingID(location.id)
    setSuccess('')
    setLoadError('')
    try {
      const updated = await updateLocation(location.id, { activa: !location.activa })
      setLocations((current) => current.map((item) => item.id === updated.id ? updated : item))
      setLoadError('')
      setSuccess(`La locacion quedo ${updated.activa ? 'activa' : 'inactiva'}.`)
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : 'No se pudo cambiar el estado.')
    } finally {
      setTogglingID(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Locaciones"
        description="Administra los talleres y espacios donde opera tu equipo."
        action={<Button variant="primary" icon={Plus} onClick={openCreate}>Nueva locacion</Button>}
      />

      <div className="feedback-stack" aria-live="polite">
        {success && <Banner title="Operacion completada" description={success} />}
        {loadError && (
          <Banner
            variant="error"
            title="No fue posible completar la solicitud"
            description={loadError}
            action={<Button variant="secondary" size="sm" icon={ArrowClockwise} onClick={() => void load()}>Reintentar</Button>}
          />
        )}
      </div>

      <section className="catalog-section" aria-label="Listado de locaciones">
        {loading ? (
          <div className="catalog-state" role="status">Cargando locaciones...</div>
        ) : loadError && locations.length === 0 ? (
          <div className="catalog-state">
            <strong>Los datos no estan disponibles</strong>
            <span>Restablece la conexion con la API para consultar las locaciones.</span>
            <Button variant="secondary" size="sm" icon={ArrowClockwise} onClick={() => void load()}>Reintentar</Button>
          </div>
        ) : locations.length === 0 ? (
          <div className="catalog-state">
            <MapPin size={28} aria-hidden="true" />
            <strong>No hay locaciones registradas</strong>
            <span>Crea la primera locacion para comenzar.</span>
            <Button variant="primary" size="sm" icon={Plus} onClick={openCreate}>Nueva locacion</Button>
          </div>
        ) : (
          <div className="table-scroll">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Codigo</Table.Head>
                  <Table.Head>Nombre</Table.Head>
                  <Table.Head>Ciudad / Estado</Table.Head>
                  <Table.Head>Zona horaria</Table.Head>
                  <Table.Head>Estado</Table.Head>
                  <Table.Head><span className="sr-only">Acciones</span></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {locations.map((location) => (
                  <Table.Row key={location.id}>
                    <Table.Cell><code className="catalog-code">{location.codigo}</code></Table.Cell>
                    <Table.Cell><strong>{location.nombre}</strong></Table.Cell>
                    <Table.Cell>{[location.ciudad, location.estado].filter(Boolean).join(', ') || 'Sin especificar'}</Table.Cell>
                    <Table.Cell>{location.zona_horaria}</Table.Cell>
                    <Table.Cell>
                      <Badge variant={location.activa ? 'success' : 'neutral'} appearance="dot">
                        {location.activa ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="row-actions">
                        <Button variant="ghost" shape="square" size="sm" icon={Eye} aria-label={`Ver ${location.nombre}`} onClick={() => setDetails(location)} />
                        <Button variant="ghost" shape="square" size="sm" icon={PencilSimple} aria-label={`Editar ${location.nombre}`} onClick={() => openEdit(location)} />
                        <Button
                          variant="ghost"
                          shape="square"
                          size="sm"
                          icon={Power}
                          loading={togglingID === location.id}
                          aria-label={`${location.activa ? 'Desactivar' : 'Activar'} ${location.nombre}`}
                          onClick={() => void toggleActive(location)}
                        />
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
        <Dialog size="lg" className="p-8">
          <Dialog.Title>{editing ? 'Editar locacion' : 'Nueva locacion'}</Dialog.Title>
          <Dialog.Description>Los campos marcados son obligatorios.</Dialog.Description>
          <form className="catalog-form" onSubmit={submit}>
            {formError && <Banner size="sm" variant="error" title="Revisa la informacion" description={formError} />}
            <div className="form-grid">
              <Input label="Codigo *" value={form.codigo} maxLength={20} onChange={(event) => updateField('codigo', event.target.value)} />
              <Input label="Nombre *" value={form.nombre} maxLength={100} onChange={(event) => updateField('nombre', event.target.value)} />
              <Input label="Ciudad" value={form.ciudad} maxLength={100} onChange={(event) => updateField('ciudad', event.target.value)} />
              <Input label="Estado" value={form.estado} maxLength={100} onChange={(event) => updateField('estado', event.target.value)} />
            </div>
            <div className="textarea-field">
              <label htmlFor="location-address">Direccion</label>
              <Textarea id="location-address" rows={3} value={form.direccion} onChange={(event) => updateField('direccion', event.target.value)} />
            </div>
            <Input label="Zona horaria *" value={form.zona_horaria} maxLength={50} onChange={(event) => updateField('zona_horaria', event.target.value)} />
            <div className="dialog-actions">
              <Dialog.Close render={(props) => <Button type="button" variant="ghost" {...props}>Cancelar</Button>} />
              <Button type="submit" variant="primary" loading={saving}>{editing ? 'Guardar cambios' : 'Crear locacion'}</Button>
            </div>
          </form>
        </Dialog>
      </Dialog.Root>

      <Dialog.Root open={details !== null} onOpenChange={(open) => { if (!open) setDetails(null) }}>
        <Dialog size="lg" className="p-8">
          <Dialog.Title>{details?.nombre ?? 'Detalle de locacion'}</Dialog.Title>
          <Dialog.Description>Informacion registrada para esta locacion.</Dialog.Description>
          {details && (
            <dl className="details-grid">
              <div><dt>Codigo</dt><dd>{details.codigo}</dd></div>
              <div><dt>Estado</dt><dd>{details.activa ? 'Activa' : 'Inactiva'}</dd></div>
              <div><dt>Direccion</dt><dd>{details.direccion || 'Sin especificar'}</dd></div>
              <div><dt>Ciudad</dt><dd>{details.ciudad || 'Sin especificar'}</dd></div>
              <div><dt>Estado / provincia</dt><dd>{details.estado || 'Sin especificar'}</dd></div>
              <div><dt>Zona horaria</dt><dd>{details.zona_horaria}</dd></div>
              <div><dt>Creada</dt><dd>{new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(details.fecha_creacion))}</dd></div>
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
