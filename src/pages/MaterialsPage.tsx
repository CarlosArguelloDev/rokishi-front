import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Badge } from '@cloudflare/kumo/components/badge'
import { Banner } from '@cloudflare/kumo/components/banner'
import { Button } from '@cloudflare/kumo/components/button'
import { Dialog } from '@cloudflare/kumo/components/dialog'
import { Input } from '@cloudflare/kumo/components/input'
import { Select } from '@cloudflare/kumo/components/select'
import { Table } from '@cloudflare/kumo/components/table'
import { ArrowClockwise, Cube, Eye, FunnelSimple, PencilSimple, Plus, Power } from '@phosphor-icons/react'
import { ApiError } from '../api/client'
import {
  createMaterial,
  listMaterials,
  type Material,
  type MaterialFilters,
  type MaterialInput,
  updateMaterial,
} from '../api/costs'
import PageHeader from '../components/PageHeader'

type MaterialForm = {
  nombre: string
  tipo: string
  marca: string
  color: string
  costo_por_kg: string
  stock_kg: string
}

type FilterForm = {
  tipo: string
  marca: string
  color: string
  activo: string
}

const EMPTY_FORM: MaterialForm = { nombre: '', tipo: '', marca: '', color: '', costo_por_kg: '', stock_kg: '0' }
const EMPTY_FILTERS: FilterForm = { tipo: '', marca: '', color: '', activo: '' }

function formFromMaterial(material: Material): MaterialForm {
  return {
    nombre: material.nombre,
    tipo: material.tipo,
    marca: material.marca ?? '',
    color: material.color ?? '',
    costo_por_kg: String(material.costo_por_kg),
    stock_kg: String(material.stock_kg),
  }
}

function toFilters(form: FilterForm): MaterialFilters {
  return {
    tipo: form.tipo || undefined,
    marca: form.marca || undefined,
    color: form.color || undefined,
    activo: form.activo === '' ? undefined : form.activo === 'true',
  }
}

function sortMaterials(materials: Material[]) {
  return [...materials].sort((a, b) => a.nombre.localeCompare(b.nombre) || a.id - b.id)
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [filters, setFilters] = useState<FilterForm>(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<MaterialFilters>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [success, setSuccess] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Material | null>(null)
  const [form, setForm] = useState<MaterialForm>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [details, setDetails] = useState<Material | null>(null)
  const [togglingID, setTogglingID] = useState<number | null>(null)

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setLoadError('')
    try {
      setMaterials(sortMaterials(await listMaterials(appliedFilters, signal)))
    } catch (error) {
      if (!signal?.aborted) setLoadError(error instanceof ApiError ? error.message : 'No se pudieron cargar los materiales.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [appliedFilters])

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(() => { if (!controller.signal.aborted) void load(controller.signal) })
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

  function openEdit(material: Material) {
    setEditing(material)
    setForm(formFromMaterial(material))
    setFormError('')
    setDetails(null)
    setFormOpen(true)
  }

  function updateField(field: keyof MaterialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    if (!form.nombre.trim() || !form.tipo.trim() || form.costo_por_kg === '' || form.stock_kg === '') {
      setFormError('Nombre, tipo, costo y stock son obligatorios.')
      return
    }
    const cost = Number(form.costo_por_kg)
    const stock = Number(form.stock_kg)
    if (!Number.isFinite(cost) || !Number.isFinite(stock) || cost < 0 || stock < 0) {
      setFormError('El costo y el stock deben ser numeros mayores o iguales a cero.')
      return
    }
    const input: MaterialInput = {
      nombre: form.nombre,
      tipo: form.tipo,
      marca: form.marca.trim() || null,
      color: form.color.trim() || null,
      costo_por_kg: cost,
      stock_kg: stock,
    }
    setSaving(true)
    setFormError('')
    try {
      const saved = editing ? await updateMaterial(editing.id, input) : await createMaterial(input)
      setMaterials((current) => sortMaterials(editing ? current.map((item) => item.id === saved.id ? saved : item) : [...current, saved]))
      setSuccess(editing ? 'El material se actualizo correctamente.' : 'El material se registro correctamente.')
      setLoadError('')
      setFormOpen(false)
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'No se pudo guardar el material.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(material: Material) {
    setTogglingID(material.id)
    setSuccess('')
    try {
      const updated = await updateMaterial(material.id, { activo: !material.activo })
      if (appliedFilters.activo !== undefined && appliedFilters.activo !== updated.activo) {
        setMaterials((current) => current.filter((item) => item.id !== updated.id))
      } else {
        setMaterials((current) => current.map((item) => item.id === updated.id ? updated : item))
      }
      setSuccess(`El material quedo ${updated.activo ? 'activo' : 'inactivo'}.`)
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : 'No se pudo cambiar el estado.')
    } finally {
      setTogglingID(null)
    }
  }

  return (
    <div>
      <PageHeader title="Materiales" description="Administra costos y existencias de materiales de produccion." action={<Button variant="primary" icon={Plus} onClick={openCreate}>Nuevo material</Button>} />

      <div className="feedback-stack" aria-live="polite">
        {success && <Banner title="Operacion completada" description={success} />}
        {loadError && <Banner variant="error" title="No fue posible completar la solicitud" description={loadError} />}
      </div>

      <form className="material-filters" onSubmit={applyFilters} aria-label="Filtros de materiales">
        <div className="filter-control"><Input label="Tipo" value={filters.tipo} maxLength={50} onChange={(event) => updateFilter('tipo', event.target.value)} /></div>
        <div className="filter-control"><Input label="Marca" value={filters.marca} maxLength={100} onChange={(event) => updateFilter('marca', event.target.value)} /></div>
        <div className="filter-control"><Input label="Color" value={filters.color} maxLength={50} onChange={(event) => updateFilter('color', event.target.value)} /></div>
        <div className="filter-control"><Select label="Estado" placeholder="Todos" value={filters.activo} onValueChange={(value) => updateFilter('activo', value ?? '')} items={[{ value: 'true', label: 'Activos' }, { value: 'false', label: 'Inactivos' }]} /></div>
        <div className="filter-actions"><Button type="button" variant="ghost" onClick={clearFilters}>Limpiar</Button><Button type="submit" variant="secondary" icon={FunnelSimple}>Aplicar</Button></div>
      </form>

      <section className="catalog-section" aria-label="Listado de materiales">
        {loading ? (
          <div className="catalog-state" role="status">Cargando materiales...</div>
        ) : loadError && materials.length === 0 ? (
          <div className="catalog-state"><strong>Los datos no estan disponibles</strong><Button variant="secondary" size="sm" icon={ArrowClockwise} onClick={() => void load()}>Reintentar</Button></div>
        ) : materials.length === 0 ? (
          <div className="catalog-state"><Cube size={28} aria-hidden="true" /><strong>No hay materiales para mostrar</strong><span>Registra un material o ajusta los filtros.</span></div>
        ) : (
          <div className="table-scroll">
            <Table>
              <Table.Header><Table.Row><Table.Head>Material</Table.Head><Table.Head>Tipo</Table.Head><Table.Head>Marca / Color</Table.Head><Table.Head>Costo/kg</Table.Head><Table.Head>Stock</Table.Head><Table.Head>Estado</Table.Head><Table.Head><span className="sr-only">Acciones</span></Table.Head></Table.Row></Table.Header>
              <Table.Body>
                {materials.map((material) => (
                  <Table.Row key={material.id}>
                    <Table.Cell><strong>{material.nombre}</strong></Table.Cell>
                    <Table.Cell>{material.tipo}</Table.Cell>
                    <Table.Cell>{[material.marca, material.color].filter(Boolean).join(' / ') || 'Sin especificar'}</Table.Cell>
                    <Table.Cell>${material.costo_por_kg.toFixed(2)}</Table.Cell>
                    <Table.Cell>{material.stock_kg.toFixed(3)} kg</Table.Cell>
                    <Table.Cell><Badge variant={material.activo ? 'success' : 'neutral'} appearance="dot">{material.activo ? 'Activo' : 'Inactivo'}</Badge></Table.Cell>
                    <Table.Cell><div className="row-actions"><Button variant="ghost" shape="square" size="sm" icon={Eye} aria-label={`Ver ${material.nombre}`} onClick={() => setDetails(material)} /><Button variant="ghost" shape="square" size="sm" icon={PencilSimple} aria-label={`Editar ${material.nombre}`} onClick={() => openEdit(material)} /><Button variant="ghost" shape="square" size="sm" icon={Power} loading={togglingID === material.id} aria-label={`${material.activo ? 'Desactivar' : 'Activar'} ${material.nombre}`} onClick={() => void toggleActive(material)} /></div></Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        )}
      </section>

      <Dialog.Root open={formOpen} onOpenChange={setFormOpen}>
        <Dialog size="lg" className="p-8">
          <Dialog.Title>{editing ? 'Editar material' : 'Nuevo material'}</Dialog.Title>
          <Dialog.Description>Los campos marcados son obligatorios.</Dialog.Description>
          <form className="catalog-form" onSubmit={submit}>
            {formError && <Banner size="sm" variant="error" title="Revisa la informacion" description={formError} />}
            <div className="form-grid">
              <Input label="Nombre *" value={form.nombre} maxLength={100} onChange={(event) => updateField('nombre', event.target.value)} />
              <Input label="Tipo *" value={form.tipo} maxLength={50} onChange={(event) => updateField('tipo', event.target.value)} />
              <Input label="Marca" value={form.marca} maxLength={100} onChange={(event) => updateField('marca', event.target.value)} />
              <Input label="Color" value={form.color} maxLength={50} onChange={(event) => updateField('color', event.target.value)} />
              <Input label="Costo por kg *" type="number" min="0" step="0.01" value={form.costo_por_kg} onChange={(event) => updateField('costo_por_kg', event.target.value)} />
              <Input label="Stock (kg) *" type="number" min="0" step="0.001" value={form.stock_kg} onChange={(event) => updateField('stock_kg', event.target.value)} />
            </div>
            <div className="dialog-actions"><Dialog.Close render={(props) => <Button type="button" variant="ghost" {...props}>Cancelar</Button>} /><Button type="submit" variant="primary" loading={saving}>{editing ? 'Guardar cambios' : 'Registrar material'}</Button></div>
          </form>
        </Dialog>
      </Dialog.Root>

      <Dialog.Root open={details !== null} onOpenChange={(open) => { if (!open) setDetails(null) }}>
        <Dialog size="lg" className="p-8">
          <Dialog.Title>{details?.nombre ?? 'Detalle de material'}</Dialog.Title>
          <Dialog.Description>Informacion de costo y existencia.</Dialog.Description>
          {details && <dl className="details-grid"><div><dt>Tipo</dt><dd>{details.tipo}</dd></div><div><dt>Estado</dt><dd>{details.activo ? 'Activo' : 'Inactivo'}</dd></div><div><dt>Marca</dt><dd>{details.marca || 'Sin especificar'}</dd></div><div><dt>Color</dt><dd>{details.color || 'Sin especificar'}</dd></div><div><dt>Costo por kg</dt><dd>${details.costo_por_kg.toFixed(2)}</dd></div><div><dt>Stock actual</dt><dd>{details.stock_kg.toFixed(3)} kg</dd></div><div><dt>Actualizado</dt><dd>{new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(details.fecha_actualizacion))}</dd></div></dl>}
          <div className="dialog-actions"><Dialog.Close render={(props) => <Button variant="ghost" {...props}>Cerrar</Button>} />{details && <Button variant="primary" icon={PencilSimple} onClick={() => openEdit(details)}>Editar</Button>}</div>
        </Dialog>
      </Dialog.Root>
    </div>
  )
}
