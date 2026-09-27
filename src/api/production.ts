import { apiRequest } from './client'

type DataResponse<T> = {
  data: T
}

export type WorkAttempt = {
  id: number
  trabajo_id: number
  numero_intento: number
  maquina_id: number
  maquina_codigo: string
  maquina_nombre: string
  fecha_inicio: string
  fecha_fin: string | null
  duracion_real_segundos: number | null
  resultado: 'EXITOSO' | 'FALLIDO' | null
  material_consumido_gramos: number | null
  desperdicio_gramos: number | null
  notas: string | null
}

export type Work = {
  id: number
  pedido_id: number
  concepto_cotizacion_id: number
  tipo_maquina_id_requerido: number
  tipo_maquina_requerido: string
  maquina_id: number | null
  maquina_codigo: string | null
  maquina_nombre: string | null
  material_id: number
  material_nombre: string
  descripcion: string | null
  cantidad_piezas: number
  duracion_estimada_minutos: number
  material_estimado_gramos: number
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO'
  fecha_creacion: string
  fecha_actualizacion: string
  intentos?: WorkAttempt[]
}

export type Order = {
  id: number
  cotizacion_id: number
  cliente_id: number
  cliente_nombre: string
  estado: 'PENDIENTE' | 'EN_PRODUCCION' | 'COMPLETADO' | 'CANCELADO'
  cantidad_trabajos: number
  trabajos_completados: number
  fecha_creacion: string
  fecha_actualizacion: string
  trabajos?: Work[]
}

export type OrderFilters = {
  cliente_id?: number
  estado?: string
}

export type FinishWorkInput = {
  resultado: 'EXITOSO' | 'FALLIDO'
  material_consumido_gramos: number
  desperdicio_gramos: number
  notas?: string | null
}

export async function createOrder(quoteID: number) {
  return (await apiRequest<DataResponse<Order>>(`/api/cotizaciones/${quoteID}/pedido`, {
    method: 'POST',
  })).data
}

export async function listOrders(filters: OrderFilters = {}, signal?: AbortSignal) {
  const query = new URLSearchParams()
  if (filters.cliente_id) query.set('cliente_id', String(filters.cliente_id))
  if (filters.estado) query.set('estado', filters.estado)
  const suffix = query.size ? `?${query.toString()}` : ''
  return (await apiRequest<DataResponse<Order[]>>(`/api/pedidos${suffix}`, { signal })).data
}

export async function getOrder(id: number, signal?: AbortSignal) {
  return (await apiRequest<DataResponse<Order>>(`/api/pedidos/${id}`, { signal })).data
}

export async function assignWorkMachine(workID: number, machineID: number) {
  return (await apiRequest<DataResponse<Work>>(`/api/trabajos/${workID}/asignacion`, {
    method: 'PATCH',
    body: JSON.stringify({ maquina_id: machineID }),
  })).data
}

export async function startWork(workID: number) {
  return (await apiRequest<DataResponse<Work>>(`/api/trabajos/${workID}/iniciar`, {
    method: 'POST',
  })).data
}

export async function finishWork(workID: number, input: FinishWorkInput) {
  return (await apiRequest<DataResponse<Work>>(`/api/trabajos/${workID}/finalizar`, {
    method: 'POST',
    body: JSON.stringify(input),
  })).data
}
