import { apiRequest } from './client'

type DataResponse<T> = {
  data: T
}

export type QuoteInput = {
  maquina_id: number
  material_id: number
  cantidad_material_gramos: number
  duracion_minutos: number
  cantidad_piezas: number
}

export type QuoteCalculation = QuoteInput & {
  costo_material: number
  costo_maquina: number
  costo_electrico: number
  costo_preparacion: number
  subtotal: number
  precio_sugerido: number
  precio_sugerido_por_pieza: number
}

export type QuoteStatus = {
  id: number
  codigo: string
  nombre: string
  descripcion: string | null
}

export type QuoteConceptInput = QuoteInput & {
  descripcion?: string | null
}

export type QuoteConcept = QuoteConceptInput & QuoteCalculation & {
  id: number
  cotizacion_id: number
  maquina_codigo: string
  maquina_nombre: string
  material_nombre: string
  costo_material_por_kg: number
  costo_interno_hora: number
  precio_venta_hora: number
  tarifa_costo_preparacion: number
  potencia_watts: number
  costo_por_kwh: number
  fecha_creacion: string
}

export type Quote = {
  id: number
  cliente_id: number
  cliente_nombre: string
  estado_cotizacion_id: number
  estado_codigo: string
  estado_nombre: string
  fecha_vencimiento: string | null
  notas: string | null
  costo_total: number
  precio_sugerido_total: number
  fecha_creacion: string
  fecha_actualizacion: string
  conceptos?: QuoteConcept[]
}

export type CreateQuoteInput = {
  cliente_id: number
  fecha_vencimiento?: string | null
  notas?: string | null
  conceptos: QuoteConceptInput[]
}

export type QuoteFilters = {
  cliente_id?: number
  estado?: string
}

export async function calculateQuote(input: QuoteInput) {
  return (await apiRequest<DataResponse<QuoteCalculation>>('/api/cotizaciones/calcular', {
    method: 'POST',
    body: JSON.stringify(input),
  })).data
}

export async function createQuote(input: CreateQuoteInput) {
  return (await apiRequest<DataResponse<Quote>>('/api/cotizaciones', {
    method: 'POST',
    body: JSON.stringify(input),
  })).data
}

export async function listQuotes(filters: QuoteFilters = {}, signal?: AbortSignal) {
  const query = new URLSearchParams()
  if (filters.cliente_id) query.set('cliente_id', String(filters.cliente_id))
  if (filters.estado) query.set('estado', filters.estado)
  const suffix = query.size ? `?${query.toString()}` : ''
  return (await apiRequest<DataResponse<Quote[]>>(`/api/cotizaciones${suffix}`, { signal })).data
}

export async function getQuote(id: number, signal?: AbortSignal) {
  return (await apiRequest<DataResponse<Quote>>(`/api/cotizaciones/${id}`, { signal })).data
}

export async function listQuoteStatuses(signal?: AbortSignal) {
  return (await apiRequest<DataResponse<QuoteStatus[]>>('/api/estados-cotizacion', { signal })).data
}

export async function changeQuoteStatus(id: number, estadoCodigo: string) {
  return (await apiRequest<DataResponse<Quote>>(`/api/cotizaciones/${id}/cambios-estado`, {
    method: 'POST',
    body: JSON.stringify({ estado_codigo: estadoCodigo }),
  })).data
}
