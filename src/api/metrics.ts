import { apiRequest } from './client'

type DataResponse<T> = {
  data: T
}

export type MetricsValues = {
  horas_trabajando: number
  horas_disponibles: number
  horas_apagadas: number
  horas_mantenimiento: number
  horas_falla: number
  horas_pausadas: number
  horas_productivas: number
  horas_improductivas: number
  horas_registradas: number
  porcentaje_utilizacion: number
  trabajos_completados: number
  intentos_fallidos: number
  tasa_exito: number
  material_consumido_gramos: number
  material_desperdiciado_gramos: number
  ingresos_estimados: number
  utilidad_estimada: number
  trabajos_sin_datos_financieros: number
}

export type MachineMetrics = MetricsValues & {
  maquina_id: number
  maquina_codigo: string
  maquina_nombre: string
  locacion_id: number
  locacion_nombre: string
  tipo_maquina_id: number
  tipo_maquina_nombre: string
}

export type MetricsReport = {
  periodo: {
    desde: string
    hasta: string
  }
  resumen: MetricsValues
  maquinas: MachineMetrics[]
  limitaciones: string[]
}

export type MetricsFilters = {
  desde?: string
  hasta?: string
  maquina_id?: number
  locacion_id?: number
  tipo_maquina_id?: number
}

export async function getMetrics(filters: MetricsFilters = {}, signal?: AbortSignal) {
  const query = new URLSearchParams()
  if (filters.desde) query.set('desde', filters.desde)
  if (filters.hasta) query.set('hasta', filters.hasta)
  if (filters.maquina_id) query.set('maquina_id', String(filters.maquina_id))
  if (filters.locacion_id) query.set('locacion_id', String(filters.locacion_id))
  if (filters.tipo_maquina_id) query.set('tipo_maquina_id', String(filters.tipo_maquina_id))
  const suffix = query.size ? `?${query.toString()}` : ''
  return (await apiRequest<DataResponse<MetricsReport>>(`/api/metricas/resumen${suffix}`, { signal })).data
}
