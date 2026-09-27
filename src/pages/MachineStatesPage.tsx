import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Badge } from '@cloudflare/kumo/components/badge'
import { Banner } from '@cloudflare/kumo/components/banner'
import { Button } from '@cloudflare/kumo/components/button'
import { Dialog } from '@cloudflare/kumo/components/dialog'
import { Input, Textarea } from '@cloudflare/kumo/components/input'
import { Select } from '@cloudflare/kumo/components/select'
import { Table } from '@cloudflare/kumo/components/table'
import { ArrowClockwise, ClockCounterClockwise, FunnelSimple, Plus } from '@phosphor-icons/react'
import { ApiError } from '../api/client'
import {
  changeMachineState,
  getCurrentMachineState,
  listMachineStateHistory,
  listMachineStates,
  type MachineState,
  type MachineStatePeriod,
  type StateHistoryFilters,
} from '../api/machineStates'
import { listMachines, type Machine } from '../api/machines'
import PageHeader from '../components/PageHeader'

type ChangeForm = {
  estado_maquina_id: string
  fecha_inicio: string
  notas: string
}

type HistoryForm = {
  desde: string
  hasta: string
}

const EMPTY_CHANGE: ChangeForm = {
  estado_maquina_id: '',
  fecha_inicio: '',
  notas: '',
}

const EMPTY_HISTORY: HistoryForm = { desde: '', hasta: '' }

function statusVariant(code: string) {
  switch (code) {
    case 'TRABAJANDO': return 'success' as const
    case 'DISPONIBLE': return 'success' as const
    case 'MANTENIMIENTO': return 'warning' as const
    case 'FALLA': return 'error' as const
    case 'PAUSADA': return 'warning' as const
    default: return 'neutral' as const
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function formatDuration(period: MachineStatePeriod) {
  const end = period.fecha_fin ? new Date(period.fecha_fin).getTime() : Date.now()
  const totalMinutes = Math.max(0, Math.floor((end - new Date(period.fecha_inicio).getTime()) / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours ? `${hours} h ${minutes} min` : `${minutes} min`
}

function toHistoryFilters(form: HistoryForm): StateHistoryFilters {
  const filters: StateHistoryFilters = {}
  if (form.desde) filters.desde = new Date(`${form.desde}T00:00:00`).toISOString()
  if (form.hasta) filters.hasta = new Date(`${form.hasta}T23:59:59.999`).toISOString()
  return filters
}

export default function MachineStatesPage() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [states, setStates] = useState<MachineState[]>([])
  const [machineID, setMachineID] = useState('')
  const [current, setCurrent] = useState<MachineStatePeriod | null>(null)
  const [history, setHistory] = useState<MachineStatePeriod[]>([])
  const [historyForm, setHistoryForm] = useState<HistoryForm>(EMPTY_HISTORY)
  const [historyFilters, setHistoryFilters] = useState<StateHistoryFilters>({})
  const [loadingCatalogs, setLoadingCatalogs] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [success, setSuccess] = useState('')
  const [changeOpen, setChangeOpen] = useState(false)
  const [changeForm, setChangeForm] = useState<ChangeForm>(EMPTY_CHANGE)
  const [changeError, setChangeError] = useState('')
  const [saving, setSaving] = useState(false)

  const selectedMachine = useMemo(
    () => machines.find((machine) => machine.id === Number(machineID)) ?? null,
    [machineID, machines],
  )

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(async () => {
      try {
        const [machineData, stateData] = await Promise.all([
          listMachines({}, controller.signal),
          listMachineStates(controller.signal),
        ])
        if (controller.signal.aborted) return
        setMachines(machineData)
        setStates(stateData)
        setMachineID((currentID) => currentID || (machineData[0] ? String(machineData[0].id) : ''))
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(error instanceof ApiError ? error.message : 'No se pudieron cargar los catalogos.')
      } finally {
        if (!controller.signal.aborted) setLoadingCatalogs(false)
      }
    })
    return () => controller.abort()
  }, [])

  const loadOperation = useCallback(async (signal?: AbortSignal) => {
    if (!machineID) {
      setCurrent(null)
      setHistory([])
      return
    }
    setLoadingHistory(true)
    setLoadError('')
    try {
      const currentRequest = getCurrentMachineState(Number(machineID), signal).catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 404) return null
        throw error
      })
      const [currentData, historyData] = await Promise.all([
        currentRequest,
        listMachineStateHistory(Number(machineID), historyFilters, signal),
      ])
      setCurrent(currentData)
      setHistory(historyData)
    } catch (error) {
      if (!signal?.aborted) setLoadError(error instanceof ApiError ? error.message : 'No se pudo cargar el historial.')
    } finally {
      if (!signal?.aborted) setLoadingHistory(false)
    }
  }, [historyFilters, machineID])

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(() => {
      if (!controller.signal.aborted) void loadOperation(controller.signal)
    })
    return () => controller.abort()
  }, [loadOperation])

  function openChange() {
    setChangeForm(EMPTY_CHANGE)
    setChangeError('')
    setChangeOpen(true)
  }

  async function submitChange(event: FormEvent) {
    event.preventDefault()
    if (saving || !machineID) return
    if (!changeForm.estado_maquina_id) {
      setChangeError('Selecciona el nuevo estado.')
      return
    }
    setSaving(true)
    setChangeError('')
    try {
      const change = await changeMachineState(Number(machineID), {
        estado_maquina_id: Number(changeForm.estado_maquina_id),
        fecha_inicio: changeForm.fecha_inicio ? new Date(changeForm.fecha_inicio).toISOString() : undefined,
        notas: changeForm.notas.trim() || null,
      })
      setCurrent(change.estado_nuevo)
      setChangeOpen(false)
      setSuccess(`Estado actualizado a ${change.estado_nuevo.estado_nombre}.`)
      await loadOperation()
    } catch (error) {
      setChangeError(error instanceof ApiError ? error.message : 'No se pudo registrar el cambio de estado.')
    } finally {
      setSaving(false)
    }
  }

  function applyHistoryFilters(event: FormEvent) {
    event.preventDefault()
    if (historyForm.desde && historyForm.hasta && historyForm.desde > historyForm.hasta) {
      setLoadError('La fecha hasta debe ser posterior o igual a la fecha desde.')
      return
    }
    setHistoryFilters(toHistoryFilters(historyForm))
  }

  function clearHistoryFilters() {
    setHistoryForm(EMPTY_HISTORY)
    setHistoryFilters({})
  }

  const machineItems = machines.map((machine) => ({
    value: String(machine.id),
    label: `${machine.codigo} - ${machine.nombre}`,
  }))
  const stateItems = states.map((state) => ({ value: String(state.id), label: state.nombre }))

  return (
    <div>
      <PageHeader
        title="Estados de maquina"
        description="Registra periodos operativos y consulta el historial de cada equipo."
        action={<Button variant="primary" icon={Plus} disabled={!machineID || states.length === 0} onClick={openChange}>Cambiar estado</Button>}
      />

      <div className="feedback-stack" aria-live="polite">
        {success && <Banner title="Cambio registrado" description={success} />}
        {loadError && <Banner variant="error" title="No fue posible completar la solicitud" description={loadError} />}
      </div>

      <section className="state-machine-selector" aria-label="Maquina seleccionada">
        <Select
          label="Maquina"
          placeholder={loadingCatalogs ? 'Cargando maquinas...' : 'Selecciona una maquina'}
          value={machineID}
          onValueChange={(value) => {
            setMachineID(value ?? '')
            setSuccess('')
          }}
          items={machineItems}
        />
        {selectedMachine && (
          <div className="selected-machine-meta">
            <span>{selectedMachine.locacion_nombre}</span>
            <span>{selectedMachine.tipo_maquina_nombre}</span>
            {!selectedMachine.activa && <Badge variant="neutral">Registro inactivo</Badge>}
          </div>
        )}
      </section>

      {machineID && (
        <section className="current-state-band" aria-label="Estado actual">
          <div>
            <span className="state-label">Estado actual</span>
            {loadingHistory ? (
              <strong>Cargando...</strong>
            ) : current ? (
              <div className="state-heading">
                <Badge variant={statusVariant(current.estado_codigo)} appearance="dot">{current.estado_nombre}</Badge>
                <strong>desde {formatDateTime(current.fecha_inicio)}</strong>
              </div>
            ) : (
              <strong>Sin estado registrado</strong>
            )}
          </div>
          <div className="current-state-notes">
            <span className="state-label">Notas</span>
            <span>{current?.notas || 'Sin notas'}</span>
          </div>
          <div className="current-state-duration">
            <span className="state-label">Duracion</span>
            <strong>{current ? formatDuration(current) : '-'}</strong>
          </div>
        </section>
      )}

      <div className="history-toolbar">
        <div>
          <h2>Historial</h2>
          <p>Los filtros incluyen periodos que estuvieron activos dentro del rango.</p>
        </div>
        <form className="history-filters" onSubmit={applyHistoryFilters}>
          <Input label="Desde" type="date" value={historyForm.desde} onChange={(event) => setHistoryForm((currentForm) => ({ ...currentForm, desde: event.target.value }))} />
          <Input label="Hasta" type="date" value={historyForm.hasta} onChange={(event) => setHistoryForm((currentForm) => ({ ...currentForm, hasta: event.target.value }))} />
          <div className="filter-actions">
            <Button type="button" variant="ghost" onClick={clearHistoryFilters}>Limpiar</Button>
            <Button type="submit" variant="secondary" icon={FunnelSimple}>Aplicar</Button>
          </div>
        </form>
      </div>

      <section className="catalog-section" aria-label="Historial de estados">
        {!machineID ? (
          <div className="catalog-state"><strong>Selecciona una maquina</strong><span>El estado actual y su historial apareceran aqui.</span></div>
        ) : loadingHistory ? (
          <div className="catalog-state" role="status">Cargando historial...</div>
        ) : loadError && history.length === 0 ? (
          <div className="catalog-state"><strong>El historial no esta disponible</strong><Button variant="secondary" size="sm" icon={ArrowClockwise} onClick={() => void loadOperation()}>Reintentar</Button></div>
        ) : history.length === 0 ? (
          <div className="catalog-state"><ClockCounterClockwise size={28} aria-hidden="true" /><strong>No hay periodos registrados</strong><span>Registra el primer estado de esta maquina.</span></div>
        ) : (
          <div className="table-scroll">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Estado</Table.Head>
                  <Table.Head>Inicio</Table.Head>
                  <Table.Head>Fin</Table.Head>
                  <Table.Head>Duracion</Table.Head>
                  <Table.Head>Notas</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {history.map((period) => (
                  <Table.Row key={period.id}>
                    <Table.Cell><Badge variant={statusVariant(period.estado_codigo)} appearance="dot">{period.estado_nombre}</Badge></Table.Cell>
                    <Table.Cell>{formatDateTime(period.fecha_inicio)}</Table.Cell>
                    <Table.Cell>{period.fecha_fin ? formatDateTime(period.fecha_fin) : 'En curso'}</Table.Cell>
                    <Table.Cell>{formatDuration(period)}</Table.Cell>
                    <Table.Cell>{period.notas || 'Sin notas'}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        )}
      </section>

      <Dialog.Root open={changeOpen} onOpenChange={setChangeOpen}>
        <Dialog size="base" className="p-8">
          <Dialog.Title>Cambiar estado</Dialog.Title>
          <Dialog.Description>{selectedMachine ? `${selectedMachine.codigo} - ${selectedMachine.nombre}` : 'Maquina seleccionada'}</Dialog.Description>
          <form className="catalog-form" onSubmit={submitChange}>
            {changeError && <Banner size="sm" variant="error" title="No se pudo registrar" description={changeError} />}
            <Select label="Nuevo estado *" placeholder="Selecciona un estado" value={changeForm.estado_maquina_id} onValueChange={(value) => setChangeForm((form) => ({ ...form, estado_maquina_id: value ?? '' }))} items={stateItems} />
            <Input label="Fecha y hora" type="datetime-local" value={changeForm.fecha_inicio} onChange={(event) => setChangeForm((form) => ({ ...form, fecha_inicio: event.target.value }))} />
            <div className="textarea-field">
              <label htmlFor="state-notes">Notas</label>
              <Textarea id="state-notes" rows={3} value={changeForm.notas} onChange={(event) => setChangeForm((form) => ({ ...form, notas: event.target.value }))} />
            </div>
            <div className="dialog-actions">
              <Dialog.Close render={(props) => <Button type="button" variant="ghost" {...props}>Cancelar</Button>} />
              <Button type="submit" variant="primary" loading={saving}>Registrar cambio</Button>
            </div>
          </form>
        </Dialog>
      </Dialog.Root>
    </div>
  )
}
