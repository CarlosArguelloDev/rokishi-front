import { apiRequest } from './client'

type DataResponse<T> = {
  data: T
}

export type Material = {
  id: number
  nombre: string
  tipo: string
  marca: string | null
  color: string | null
  costo_por_kg: number
  stock_kg: number
  activo: boolean
  fecha_actualizacion: string
}

export type MaterialInput = {
  nombre: string
  tipo: string
  marca?: string | null
  color?: string | null
  costo_por_kg: number
  stock_kg: number
}

export type MaterialUpdate = Partial<MaterialInput> & {
  activo?: boolean
}

export type MaterialFilters = {
  tipo?: string
  marca?: string
  color?: string
  activo?: boolean
}

export type MachineRate = {
  id: number
  maquina_id: number
  costo_interno_hora: number
  precio_venta_hora: number
  costo_preparacion: number
  fecha_actualizacion: string
}

export type MachineRateInput = Pick<MachineRate, 'costo_interno_hora' | 'precio_venta_hora' | 'costo_preparacion'>

export type EnergyRate = {
  id: number
  locacion_id: number
  costo_por_kwh: number
  fecha_actualizacion: string
}

function materialQuery(filters: MaterialFilters) {
  const query = new URLSearchParams()
  if (filters.tipo?.trim()) query.set('tipo', filters.tipo.trim())
  if (filters.marca?.trim()) query.set('marca', filters.marca.trim())
  if (filters.color?.trim()) query.set('color', filters.color.trim())
  if (filters.activo !== undefined) query.set('activo', String(filters.activo))
  return query.size ? `?${query.toString()}` : ''
}

export async function listMaterials(filters: MaterialFilters = {}, signal?: AbortSignal) {
  return (await apiRequest<DataResponse<Material[]>>(`/api/materiales${materialQuery(filters)}`, { signal })).data
}

export async function createMaterial(input: MaterialInput) {
  return (await apiRequest<DataResponse<Material>>('/api/materiales', {
    method: 'POST', body: JSON.stringify(input),
  })).data
}

export async function updateMaterial(id: number, input: MaterialUpdate) {
  return (await apiRequest<DataResponse<Material>>(`/api/materiales/${id}`, {
    method: 'PATCH', body: JSON.stringify(input),
  })).data
}

export async function getMachineRate(machineID: number, signal?: AbortSignal) {
  return (await apiRequest<DataResponse<MachineRate | null>>(`/api/maquinas/${machineID}/tarifa`, { signal })).data
}

export async function putMachineRate(machineID: number, input: MachineRateInput) {
  return (await apiRequest<DataResponse<MachineRate>>(`/api/maquinas/${machineID}/tarifa`, {
    method: 'PUT', body: JSON.stringify(input),
  })).data
}

export async function getEnergyRate(locationID: number, signal?: AbortSignal) {
  return (await apiRequest<DataResponse<EnergyRate | null>>(`/api/locaciones/${locationID}/tarifa-energia`, { signal })).data
}

export async function putEnergyRate(locationID: number, costoPorKWh: number) {
  return (await apiRequest<DataResponse<EnergyRate>>(`/api/locaciones/${locationID}/tarifa-energia`, {
    method: 'PUT', body: JSON.stringify({ costo_por_kwh: costoPorKWh }),
  })).data
}
