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

export async function calculateQuote(input: QuoteInput) {
  return (await apiRequest<DataResponse<QuoteCalculation>>('/api/cotizaciones/calcular', {
    method: 'POST',
    body: JSON.stringify(input),
  })).data
}
