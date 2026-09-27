import { apiRequest } from './client'

type DataResponse<T> = {
  data: T
}

export type Machine = {
  id: number
  locacion_id: number
  locacion_codigo: string
  locacion_nombre: string
  tipo_maquina_id: number
  tipo_maquina_nombre: string
  codigo: string
  nombre: string
  marca: string | null
  modelo: string | null
  numero_serie: string | null
  potencia_watts: number | null
  fecha_compra: string | null
  activa: boolean
  fecha_creacion: string
}

export type MachineInput = {
  locacion_id: number
  tipo_maquina_id: number
  codigo: string
  nombre: string
  marca?: string | null
  modelo?: string | null
  numero_serie?: string | null
  potencia_watts?: number | null
  fecha_compra?: string | null
}

export type MachineUpdate = Partial<MachineInput> & {
  activa?: boolean
}

export type MachineFilters = {
  locacion_id?: number
  tipo_maquina_id?: number
  activa?: boolean
  q?: string
}

export async function listMachines(filters: MachineFilters = {}, signal?: AbortSignal) {
  const query = new URLSearchParams()
  if (filters.locacion_id) query.set('locacion_id', String(filters.locacion_id))
  if (filters.tipo_maquina_id) query.set('tipo_maquina_id', String(filters.tipo_maquina_id))
  if (filters.activa !== undefined) query.set('activa', String(filters.activa))
  if (filters.q?.trim()) query.set('q', filters.q.trim())
  const suffix = query.size ? `?${query.toString()}` : ''
  return (await apiRequest<DataResponse<Machine[]>>(`/api/maquinas${suffix}`, { signal })).data
}

export async function createMachine(input: MachineInput) {
  return (await apiRequest<DataResponse<Machine>>('/api/maquinas', {
    method: 'POST',
    body: JSON.stringify(input),
  })).data
}

export async function updateMachine(id: number, input: MachineUpdate) {
  return (await apiRequest<DataResponse<Machine>>(`/api/maquinas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })).data
}
