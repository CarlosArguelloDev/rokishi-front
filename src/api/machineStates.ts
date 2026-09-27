import { apiRequest } from './client'

type DataResponse<T> = {
  data: T
}

export type MachineState = {
  id: number
  codigo: string
  nombre: string
  descripcion: string | null
}

export type MachineStatePeriod = {
  id: number
  maquina_id: number
  estado_maquina_id: number
  estado_codigo: string
  estado_nombre: string
  fecha_inicio: string
  fecha_fin: string | null
  notas: string | null
}

export type MachineStateChange = {
  estado_anterior: MachineStatePeriod | null
  estado_nuevo: MachineStatePeriod
}

export type StateHistoryFilters = {
  desde?: string
  hasta?: string
}

export type ChangeMachineStateInput = {
  estado_maquina_id: number
  fecha_inicio?: string
  notas?: string | null
}

export async function listMachineStates(signal?: AbortSignal) {
  return (await apiRequest<DataResponse<MachineState[]>>('/api/estados-maquina', { signal })).data
}

export async function getCurrentMachineState(machineID: number, signal?: AbortSignal) {
  return (await apiRequest<DataResponse<MachineStatePeriod>>(`/api/maquinas/${machineID}/estado-actual`, { signal })).data
}

export async function listMachineStateHistory(machineID: number, filters: StateHistoryFilters = {}, signal?: AbortSignal) {
  const query = new URLSearchParams()
  if (filters.desde) query.set('desde', filters.desde)
  if (filters.hasta) query.set('hasta', filters.hasta)
  const suffix = query.size ? `?${query.toString()}` : ''
  return (await apiRequest<DataResponse<MachineStatePeriod[]>>(`/api/maquinas/${machineID}/historial-estados${suffix}`, { signal })).data
}

export async function changeMachineState(machineID: number, input: ChangeMachineStateInput) {
  return (await apiRequest<DataResponse<MachineStateChange>>(`/api/maquinas/${machineID}/cambios-estado`, {
    method: 'POST',
    body: JSON.stringify(input),
  })).data
}
