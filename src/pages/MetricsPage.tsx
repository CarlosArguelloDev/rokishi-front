import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Badge } from '@cloudflare/kumo/components/badge'
import { Banner } from '@cloudflare/kumo/components/banner'
import { Button } from '@cloudflare/kumo/components/button'
import { Input } from '@cloudflare/kumo/components/input'
import { Select } from '@cloudflare/kumo/components/select'
import { Table } from '@cloudflare/kumo/components/table'
import { ArrowClockwise, ChartBar, FunnelSimple } from '@phosphor-icons/react'
import { listLocations, listMachineTypes, type Location, type MachineType } from '../api/catalogs'
import { ApiError } from '../api/client'
import { listMachines, type Machine } from '../api/machines'
import { getMetrics, type MetricsFilters, type MetricsReport, type MetricsValues } from '../api/metrics'
import PageHeader from '../components/PageHeader'

type FilterForm = {
  from: string
  to: string
  locationID: string
  machineTypeID: string
  machineID: string
}

const moneyFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
const numberFormatter = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 })
const dateFormatter = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' })

function dateValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

function defaultFilters(): FilterForm {
  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - 30)
  return { from: dateValue(from), to: dateValue(to), locationID: '', machineTypeID: '', machineID: '' }
}

function apiFilters(form: FilterForm): MetricsFilters {
  const inclusiveTo = new Date(`${form.to}T00:00:00`)
  inclusiveTo.setDate(inclusiveTo.getDate() + 1)
  return {
    desde: new Date(`${form.from}T00:00:00`).toISOString(),
    hasta: inclusiveTo.toISOString(),
    locacion_id: form.locationID ? Number(form.locationID) : undefined,
    tipo_maquina_id: form.machineTypeID ? Number(form.machineTypeID) : undefined,
    maquina_id: form.machineID ? Number(form.machineID) : undefined,
  }
}

function metricHours(value: number) {
  return `${numberFormatter.format(value)} h`
}

function metricGrams(value: number) {
  return value >= 1000 ? `${numberFormatter.format(value / 1000)} kg` : `${numberFormatter.format(value)} g`
}

function MetricValue({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="metric-value"><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div>
}

const STATE_METRICS: Array<{ field: keyof MetricsValues; label: string; className: string }> = [
  { field: 'horas_trabajando', label: 'Trabajando', className: 'metric-state-working' },
  { field: 'horas_disponibles', label: 'Disponible', className: 'metric-state-available' },
  { field: 'horas_apagadas', label: 'Apagada', className: 'metric-state-off' },
  { field: 'horas_mantenimiento', label: 'Mantenimiento', className: 'metric-state-maintenance' },
  { field: 'horas_falla', label: 'Falla', className: 'metric-state-failure' },
  { field: 'horas_pausadas', label: 'Pausada', className: 'metric-state-paused' },
]

export default function MetricsPage() {
  const [filters, setFilters] = useState<FilterForm>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<FilterForm>(defaultFilters)
  const [locations, setLocations] = useState<Location[]>([])
  const [machineTypes, setMachineTypes] = useState<MachineType[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [report, setReport] = useState<MetricsReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [filterError, setFilterError] = useState('')

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setLoadError('')
    try {
      setReport(await getMetrics(apiFilters(appliedFilters), signal))
    } catch (error) {
      if (!signal?.aborted) setLoadError(error instanceof ApiError ? error.message : 'No se pudieron cargar las metricas.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [appliedFilters])

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(async () => {
      try {
        const [locationData, typeData, machineData] = await Promise.all([
          listLocations(controller.signal), listMachineTypes(controller.signal), listMachines({}, controller.signal),
        ])
        if (!controller.signal.aborted) {
          setLocations(locationData)
          setMachineTypes(typeData)
          setMachines(machineData)
        }
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(error instanceof ApiError ? error.message : 'No se pudieron cargar los filtros.')
      }
    })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(() => { if (!controller.signal.aborted) void load(controller.signal) })
    return () => controller.abort()
  }, [load])

  function applyFilters(event: FormEvent) {
    event.preventDefault()
    if (!filters.from || !filters.to || filters.from > filters.to) {
      setFilterError('La fecha final debe ser igual o posterior a la fecha inicial.')
      return
    }
    setFilterError('')
    setAppliedFilters(filters)
  }

  function updateDimension(field: 'locationID' | 'machineTypeID', value: string) {
    setFilters((current) => ({ ...current, [field]: value, machineID: '' }))
  }

  const availableMachines = machines.filter((machine) => (
    (!filters.locationID || machine.locacion_id === Number(filters.locationID))
    && (!filters.machineTypeID || machine.tipo_maquina_id === Number(filters.machineTypeID))
  ))
  const summary = report?.resumen
  const recordedHours = summary?.horas_registradas ?? 0

  return (
    <div>
      <PageHeader title="Metricas" description="Consulta rendimiento operativo, produccion y resultados estimados." action={<Button variant="secondary" icon={ArrowClockwise} loading={loading} onClick={() => void load()}>Actualizar</Button>} />

      <div className="feedback-stack" aria-live="polite">
        {filterError && <Banner variant="error" title="Rango no valido" description={filterError} />}
        {loadError && <Banner variant="error" title="Metricas no disponibles" description={loadError} />}
      </div>

      <form className="metrics-filters" onSubmit={applyFilters} aria-label="Filtros de metricas">
        <Input label="Desde" type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} />
        <Input label="Hasta" type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} />
        <Select label="Locacion" placeholder="Todas" value={filters.locationID} onValueChange={(value) => updateDimension('locationID', value ?? '')} items={locations.map((location) => ({ value: String(location.id), label: location.nombre }))} />
        <Select label="Tipo" placeholder="Todos" value={filters.machineTypeID} onValueChange={(value) => updateDimension('machineTypeID', value ?? '')} items={machineTypes.map((type) => ({ value: String(type.id), label: type.nombre }))} />
        <Select label="Maquina" placeholder="Todas" value={filters.machineID} onValueChange={(value) => setFilters((current) => ({ ...current, machineID: value ?? '' }))} items={availableMachines.map((machine) => ({ value: String(machine.id), label: `${machine.codigo} - ${machine.nombre}` }))} />
        <Button type="submit" variant="secondary" icon={FunnelSimple}>Aplicar</Button>
      </form>

      {loading && !report ? <div className="catalog-state" role="status">Calculando metricas...</div> : report && summary ? <>
        <section className="metrics-overview" aria-label="Resumen de metricas">
          <MetricValue label="Utilizacion" value={`${numberFormatter.format(summary.porcentaje_utilizacion)}%`} detail={`${metricHours(summary.horas_registradas)} registradas`} />
          <MetricValue label="Tiempo productivo" value={metricHours(summary.horas_productivas)} detail={`${metricHours(summary.horas_improductivas)} improductivas`} />
          <MetricValue label="Trabajos completados" value={numberFormatter.format(summary.trabajos_completados)} detail={`${summary.intentos_fallidos} intentos fallidos`} />
          <MetricValue label="Tasa de exito" value={`${numberFormatter.format(summary.tasa_exito)}%`} detail="Sobre intentos terminados" />
          <MetricValue label="Material consumido" value={metricGrams(summary.material_consumido_gramos)} detail={`${metricGrams(summary.material_desperdiciado_gramos)} desperdiciados`} />
          <MetricValue label="Ingresos estimados" value={moneyFormatter.format(summary.ingresos_estimados)} detail={`${summary.trabajos_sin_datos_financieros} trabajos sin importe`} />
          <MetricValue label="Utilidad estimada" value={moneyFormatter.format(summary.utilidad_estimada)} detail="Precio sugerido menos costo" />
        </section>

        <section className="metrics-section" aria-labelledby="state-distribution-title">
          <div className="metrics-section-heading"><div><h2 id="state-distribution-title">Distribucion de estados</h2><p>{dateFormatter.format(new Date(report.periodo.desde))} a {dateFormatter.format(new Date(report.periodo.hasta))}</p></div><Badge variant="neutral">{report.maquinas.length} maquinas</Badge></div>
          <div className="metric-state-bar" aria-label="Distribucion proporcional de horas registradas">{STATE_METRICS.map((state) => {
            const hours = Number(summary[state.field])
            const width = recordedHours > 0 ? hours / recordedHours * 100 : 0
            return width > 0 && <span key={state.field} className={state.className} style={{ width: `${width}%` }} title={`${state.label}: ${metricHours(hours)}`} />
          })}</div>
          <div className="metric-state-legend">{STATE_METRICS.map((state) => <div key={state.field}><span className={`metric-state-swatch ${state.className}`} /><span>{state.label}</span><strong>{metricHours(Number(summary[state.field]))}</strong></div>)}</div>
        </section>

        <section className="metrics-section" aria-labelledby="machine-comparison-title">
          <div className="metrics-section-heading"><div><h2 id="machine-comparison-title">Rendimiento por maquina</h2><p>Comparativo del periodo y filtros seleccionados.</p></div></div>
          {report.maquinas.length === 0 ? <div className="catalog-state"><ChartBar size={28} aria-hidden="true" /><strong>No hay maquinas para estos filtros</strong><span>Ajusta el rango o los catalogos seleccionados.</span></div> : <div className="table-scroll metrics-table"><Table>
            <Table.Header><Table.Row><Table.Head>Maquina</Table.Head><Table.Head>Ubicacion / tipo</Table.Head><Table.Head>Utilizacion</Table.Head><Table.Head>Horas</Table.Head><Table.Head>Produccion</Table.Head><Table.Head>Material</Table.Head><Table.Head>Resultado estimado</Table.Head></Table.Row></Table.Header>
            <Table.Body>{report.maquinas.map((machine) => <Table.Row key={machine.maquina_id}>
              <Table.Cell><strong>{machine.maquina_codigo}</strong><br /><span className="table-secondary">{machine.maquina_nombre}</span></Table.Cell>
              <Table.Cell>{machine.locacion_nombre}<br /><span className="table-secondary">{machine.tipo_maquina_nombre}</span></Table.Cell>
              <Table.Cell><strong>{numberFormatter.format(machine.porcentaje_utilizacion)}%</strong><div className="metric-utilization-track"><span style={{ width: `${Math.min(100, machine.porcentaje_utilizacion)}%` }} /></div></Table.Cell>
              <Table.Cell>{metricHours(machine.horas_trabajando)} productivas<br /><span className="table-secondary">{metricHours(machine.horas_improductivas)} improductivas</span></Table.Cell>
              <Table.Cell>{machine.trabajos_completados} completados<br /><span className="table-secondary">{machine.intentos_fallidos} fallidos</span></Table.Cell>
              <Table.Cell>{metricGrams(machine.material_consumido_gramos)}<br /><span className="table-secondary">{metricGrams(machine.material_desperdiciado_gramos)} desperdicio</span></Table.Cell>
              <Table.Cell>{moneyFormatter.format(machine.ingresos_estimados)}<br /><span className="table-secondary">{moneyFormatter.format(machine.utilidad_estimada)} utilidad</span></Table.Cell>
            </Table.Row>)}</Table.Body>
          </Table></div>}
        </section>

        <div className="metrics-limitations">{report.limitaciones.map((limitation) => <p key={limitation}>{limitation}</p>)}</div>
      </> : null}
    </div>
  )
}
