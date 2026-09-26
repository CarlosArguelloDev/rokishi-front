import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Banner } from '@cloudflare/kumo/components/banner'
import { Button } from '@cloudflare/kumo/components/button'
import { Dialog } from '@cloudflare/kumo/components/dialog'
import { Input, Textarea } from '@cloudflare/kumo/components/input'
import { Table } from '@cloudflare/kumo/components/table'
import { ArrowClockwise, Eye, PencilSimple, Plus, Wrench } from '@phosphor-icons/react'
import {
  createMachineType,
  listMachineTypes,
  type MachineType,
  updateMachineType,
} from '../api/catalogs'
import { ApiError } from '../api/client'
import PageHeader from '../components/PageHeader'

type MachineTypeForm = {
  nombre: string
  descripcion: string
}

const EMPTY_FORM: MachineTypeForm = { nombre: '', descripcion: '' }

function sortMachineTypes(machineTypes: MachineType[]) {
  return [...machineTypes].sort((a, b) => a.nombre.localeCompare(b.nombre) || a.id - b.id)
}

export default function MachineTypesPage() {
  const [machineTypes, setMachineTypes] = useState<MachineType[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [success, setSuccess] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<MachineType | null>(null)
  const [details, setDetails] = useState<MachineType | null>(null)
  const [form, setForm] = useState<MachineTypeForm>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setLoadError('')
    try {
      setMachineTypes(await listMachineTypes(signal))
    } catch (error) {
      if (!signal?.aborted) {
        setLoadError(error instanceof ApiError ? error.message : 'No se pudieron cargar los tipos de maquina.')
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

  function openEdit(machineType: MachineType) {
    setEditing(machineType)
    setForm({ nombre: machineType.nombre, descripcion: machineType.descripcion ?? '' })
    setFormError('')
    setDetails(null)
    setFormOpen(true)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    if (!form.nombre.trim()) {
      setFormError('El nombre es obligatorio.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const input = { nombre: form.nombre, descripcion: form.descripcion || null }
      const saved = editing
        ? await updateMachineType(editing.id, input)
        : await createMachineType(input)
      setMachineTypes((current) => sortMachineTypes(
        editing ? current.map((item) => item.id === saved.id ? saved : item) : [...current, saved],
      ))
      setLoadError('')
      setSuccess(editing ? 'El tipo de maquina se actualizo correctamente.' : 'El tipo de maquina se creo correctamente.')
      setFormOpen(false)
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'No se pudo guardar el tipo de maquina.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Tipos de maquina"
        description="Define las clases de equipo disponibles en el taller."
        action={<Button variant="primary" icon={Plus} onClick={openCreate}>Nuevo tipo</Button>}
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

      <section className="catalog-section" aria-label="Listado de tipos de maquina">
        {loading ? (
          <div className="catalog-state" role="status">Cargando tipos de maquina...</div>
        ) : loadError && machineTypes.length === 0 ? (
          <div className="catalog-state">
            <strong>Los datos no estan disponibles</strong>
            <span>Restablece la conexion con la API para consultar los tipos de maquina.</span>
            <Button variant="secondary" size="sm" icon={ArrowClockwise} onClick={() => void load()}>Reintentar</Button>
          </div>
        ) : machineTypes.length === 0 ? (
          <div className="catalog-state">
            <Wrench size={28} aria-hidden="true" />
            <strong>No hay tipos de maquina registrados</strong>
            <span>Crea el primer tipo para clasificar el equipo.</span>
            <Button variant="primary" size="sm" icon={Plus} onClick={openCreate}>Nuevo tipo</Button>
          </div>
        ) : (
          <div className="table-scroll">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Nombre</Table.Head>
                  <Table.Head>Descripcion</Table.Head>
                  <Table.Head><span className="sr-only">Acciones</span></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {machineTypes.map((machineType) => (
                  <Table.Row key={machineType.id}>
                    <Table.Cell><strong>{machineType.nombre}</strong></Table.Cell>
                    <Table.Cell>{machineType.descripcion || 'Sin descripcion'}</Table.Cell>
                    <Table.Cell>
                      <div className="row-actions">
                        <Button variant="ghost" shape="square" size="sm" icon={Eye} aria-label={`Ver ${machineType.nombre}`} onClick={() => setDetails(machineType)} />
                        <Button variant="ghost" shape="square" size="sm" icon={PencilSimple} aria-label={`Editar ${machineType.nombre}`} onClick={() => openEdit(machineType)} />
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
          <Dialog.Title>{editing ? 'Editar tipo de maquina' : 'Nuevo tipo de maquina'}</Dialog.Title>
          <Dialog.Description>El nombre debe identificar claramente esta clase de equipo.</Dialog.Description>
          <form className="catalog-form" onSubmit={submit}>
            {formError && <Banner size="sm" variant="error" title="Revisa la informacion" description={formError} />}
            <Input
              label="Nombre *"
              value={form.nombre}
              maxLength={100}
              onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
            />
            <div className="textarea-field">
              <label htmlFor="machine-type-description">Descripcion</label>
              <Textarea
                id="machine-type-description"
                rows={5}
                value={form.descripcion}
                onChange={(event) => setForm((current) => ({ ...current, descripcion: event.target.value }))}
              />
            </div>
            <div className="dialog-actions">
              <Dialog.Close render={(props) => <Button type="button" variant="ghost" {...props}>Cancelar</Button>} />
              <Button type="submit" variant="primary" loading={saving}>{editing ? 'Guardar cambios' : 'Crear tipo'}</Button>
            </div>
          </form>
        </Dialog>
      </Dialog.Root>

      <Dialog.Root open={details !== null} onOpenChange={(open) => { if (!open) setDetails(null) }}>
        <Dialog className="p-8">
          <Dialog.Title>{details?.nombre ?? 'Detalle del tipo'}</Dialog.Title>
          <Dialog.Description>Informacion registrada para este tipo de maquina.</Dialog.Description>
          <dl className="details-grid">
            <div><dt>Nombre</dt><dd>{details?.nombre}</dd></div>
            <div><dt>Descripcion</dt><dd>{details?.descripcion || 'Sin descripcion'}</dd></div>
          </dl>
          <div className="dialog-actions">
            <Dialog.Close render={(props) => <Button variant="ghost" {...props}>Cerrar</Button>} />
            {details && <Button variant="primary" icon={PencilSimple} onClick={() => openEdit(details)}>Editar</Button>}
          </div>
        </Dialog>
      </Dialog.Root>
    </div>
  )
}
