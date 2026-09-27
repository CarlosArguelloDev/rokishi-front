import { type FormEvent, useEffect, useState } from 'react'
import { Banner } from '@cloudflare/kumo/components/banner'
import { Button } from '@cloudflare/kumo/components/button'
import { Dialog } from '@cloudflare/kumo/components/dialog'
import { Input, Textarea } from '@cloudflare/kumo/components/input'
import { Select } from '@cloudflare/kumo/components/select'
import { Plus, Trash } from '@phosphor-icons/react'
import { listMachineTypes, type MachineType } from '../api/catalogs'
import { ApiError } from '../api/client'
import { listMaterials, type Material } from '../api/costs'
import type { Customer } from '../api/customers'
import { listMachines, type Machine } from '../api/machines'
import { createDirectOrder, type DirectOrderInput, type Order } from '../api/production'

type DirectOrderDialogProps = {
  open: boolean
  customers: Customer[]
  onOpenChange: (open: boolean) => void
  onCreated: (order: Order) => void | Promise<void>
}

type WorkForm = {
  key: number
  description: string
  machineTypeID: string
  machineID: string
  materialID: string
  pieces: string
  minutes: string
  grams: string
}

type OrderForm = {
  customerID: string
  channel: 'DIRECTO' | 'PLATAFORMA'
  platform: string
  notes: string
  works: WorkForm[]
}

let nextWorkKey = 1

function emptyWork(): WorkForm {
  return {
    key: nextWorkKey++,
    description: '',
    machineTypeID: '',
    machineID: '',
    materialID: '',
    pieces: '1',
    minutes: '',
    grams: '',
  }
}

function emptyForm(): OrderForm {
  return { customerID: '', channel: 'DIRECTO', platform: '', notes: '', works: [emptyWork()] }
}

export default function DirectOrderDialog({ open, customers, onOpenChange, onCreated }: DirectOrderDialogProps) {
  const [form, setForm] = useState<OrderForm>(emptyForm)
  const [machineTypes, setMachineTypes] = useState<MachineType[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [loadingCatalogs, setLoadingCatalogs] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    queueMicrotask(() => {
      if (controller.signal.aborted) return
      setForm(emptyForm())
      setError('')
      setLoadingCatalogs(true)
      Promise.all([
        listMachineTypes(controller.signal),
        listMachines({ activa: true }, controller.signal),
        listMaterials({ activo: true }, controller.signal),
      ]).then(([typeData, machineData, materialData]) => {
        setMachineTypes(typeData)
        setMachines(machineData)
        setMaterials(materialData)
      }).catch((loadError) => {
        if (!controller.signal.aborted) setError(loadError instanceof ApiError ? loadError.message : 'No se pudieron cargar los catalogos.')
      }).finally(() => {
        if (!controller.signal.aborted) setLoadingCatalogs(false)
      })
    })
    return () => controller.abort()
  }, [open])

  function updateWork(key: number, field: keyof Omit<WorkForm, 'key'>, value: string) {
    setForm((current) => ({
      ...current,
      works: current.works.map((work) => work.key === key
        ? { ...work, [field]: value, ...(field === 'machineTypeID' ? { machineID: '' } : {}) }
        : work),
    }))
  }

  function removeWork(key: number) {
    setForm((current) => ({ ...current, works: current.works.filter((work) => work.key !== key) }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    if (!form.customerID) {
      setError('Selecciona el cliente que realizo el pedido.')
      return
    }
    if (form.channel === 'PLATAFORMA' && !form.platform.trim()) {
      setError('Escribe el nombre de la plataforma de venta.')
      return
    }

    const works: DirectOrderInput['trabajos'] = []
    for (const [index, work] of form.works.entries()) {
      const pieces = Number(work.pieces)
      const minutes = Number(work.minutes)
      const grams = Number(work.grams)
      if (!work.machineTypeID || !work.materialID || !Number.isInteger(pieces) || pieces < 1
        || !Number.isInteger(minutes) || minutes < 1 || !Number.isFinite(grams) || grams <= 0) {
        setError(`Completa los datos obligatorios del trabajo ${index + 1} con valores mayores a cero.`)
        return
      }
      works.push({
        descripcion: work.description.trim() || null,
        tipo_maquina_id: Number(work.machineTypeID),
        maquina_id: work.machineID ? Number(work.machineID) : null,
        material_id: Number(work.materialID),
        cantidad_piezas: pieces,
        duracion_estimada_minutos: minutes,
        material_estimado_gramos: grams,
      })
    }

    setSaving(true)
    setError('')
    try {
      const order = await createDirectOrder({
        cliente_id: Number(form.customerID),
        plataforma_venta: form.channel === 'PLATAFORMA' ? form.platform.trim() : null,
        notas: form.notes.trim() || null,
        trabajos: works,
      })
      await onCreated(order)
    } catch (saveError) {
      setError(saveError instanceof ApiError ? saveError.message : 'No se pudo crear el pedido.')
    } finally {
      setSaving(false)
    }
  }

  const customerItems = customers.filter((customer) => customer.activo).map((customer) => ({
    value: String(customer.id),
    label: `${customer.nombre} (${customer.tipo === 'EMPRESA' ? 'empresa' : 'persona'})`,
  }))
  const machineTypeItems = machineTypes.map((type) => ({ value: String(type.id), label: type.nombre }))
  const materialItems = materials.map((material) => ({ value: String(material.id), label: `${material.nombre} - ${material.stock_kg} kg` }))

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog size="lg" className="direct-order-dialog p-8">
        <Dialog.Title>Nuevo pedido</Dialog.Title>
        <Dialog.Description>Registra una venta directa o de una plataforma sin crear una cotizacion.</Dialog.Description>
        <form className="direct-order-form" onSubmit={submit}>
          {error && <Banner size="sm" variant="error" title="Revisa la informacion" description={error} />}
          <div className="form-grid">
            <Select label="Cliente *" placeholder="Selecciona un cliente" value={form.customerID} onValueChange={(value) => setForm((current) => ({ ...current, customerID: value ?? '' }))} items={customerItems} />
            <Select label="Canal de venta *" value={form.channel} onValueChange={(value) => setForm((current) => ({ ...current, channel: (value ?? 'DIRECTO') as OrderForm['channel'], platform: value === 'PLATAFORMA' ? current.platform : '' }))} items={[{ value: 'DIRECTO', label: 'Venta directa' }, { value: 'PLATAFORMA', label: 'Plataforma de venta' }]} />
          </div>
          {form.channel === 'PLATAFORMA' && <Input label="Plataforma *" placeholder="Ej. Mercado Libre, Etsy o Shopify" value={form.platform} maxLength={100} onChange={(event) => setForm((current) => ({ ...current, platform: event.target.value }))} />}
          <div className="textarea-field"><label htmlFor="direct-order-notes">Notas del pedido</label><Textarea id="direct-order-notes" rows={2} maxLength={2000} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></div>

          <div className="direct-order-heading"><div><strong>Trabajos</strong><span>Agrega cada pieza o lote que deba producirse.</span></div><Button type="button" variant="secondary" size="sm" icon={Plus} onClick={() => setForm((current) => ({ ...current, works: [...current.works, emptyWork()] }))}>Agregar trabajo</Button></div>
          {loadingCatalogs ? <div className="direct-order-loading" role="status">Cargando catalogos...</div> : form.works.map((work, index) => {
            const compatibleMachines = machines.filter((machine) => machine.tipo_maquina_id === Number(work.machineTypeID))
            const machineItems = compatibleMachines.map((machine) => ({ value: String(machine.id), label: `${machine.codigo} - ${machine.nombre}` }))
            return <section className="direct-order-work" key={work.key} aria-label={`Trabajo ${index + 1}`}>
              <div className="direct-order-work-heading"><strong>Trabajo {index + 1}</strong>{form.works.length > 1 && <Button type="button" variant="ghost" shape="square" size="sm" icon={Trash} aria-label={`Eliminar trabajo ${index + 1}`} onClick={() => removeWork(work.key)} />}</div>
              <Input label="Descripcion" value={work.description} maxLength={200} onChange={(event) => updateWork(work.key, 'description', event.target.value)} />
              <div className="direct-order-grid">
                <Select label="Tipo de maquina *" placeholder="Selecciona un tipo" value={work.machineTypeID} onValueChange={(value) => updateWork(work.key, 'machineTypeID', value ?? '')} items={machineTypeItems} />
                <Select label="Maquina inicial" placeholder="Asignar despues" value={work.machineID} onValueChange={(value) => updateWork(work.key, 'machineID', value ?? '')} items={machineItems} disabled={!work.machineTypeID} />
                <Select label="Material *" placeholder="Selecciona un material" value={work.materialID} onValueChange={(value) => updateWork(work.key, 'materialID', value ?? '')} items={materialItems} />
              </div>
              <div className="direct-order-grid">
                <Input label="Material estimado (g) *" type="number" min="0.001" step="0.001" value={work.grams} onChange={(event) => updateWork(work.key, 'grams', event.target.value)} />
                <Input label="Duracion estimada (min) *" type="number" min="1" step="1" value={work.minutes} onChange={(event) => updateWork(work.key, 'minutes', event.target.value)} />
                <Input label="Cantidad de piezas *" type="number" min="1" step="1" value={work.pieces} onChange={(event) => updateWork(work.key, 'pieces', event.target.value)} />
              </div>
            </section>
          })}
          <div className="dialog-actions"><Dialog.Close render={(props) => <Button type="button" variant="ghost" {...props}>Cancelar</Button>} /><Button type="submit" variant="primary" loading={saving} disabled={loadingCatalogs || customerItems.length === 0}>Crear pedido</Button></div>
        </form>
      </Dialog>
    </Dialog.Root>
  )
}
