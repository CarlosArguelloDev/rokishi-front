import { apiRequest } from './client'

type DataResponse<T> = {
  data: T
}

export type Location = {
  id: number
  codigo: string
  nombre: string
  direccion: string | null
  ciudad: string | null
  estado: string | null
  zona_horaria: string
  activa: boolean
  fecha_creacion: string
}

export type LocationInput = {
  codigo: string
  nombre: string
  direccion?: string | null
  ciudad?: string | null
  estado?: string | null
  zona_horaria?: string
}

export type LocationUpdate = Partial<LocationInput> & {
  activa?: boolean
}

export type MachineType = {
  id: number
  nombre: string
  descripcion: string | null
}

export type MachineTypeInput = {
  nombre: string
  descripcion?: string | null
}

export async function listLocations(signal?: AbortSignal) {
  return (await apiRequest<DataResponse<Location[]>>('/api/locaciones', { signal })).data
}

export async function createLocation(input: LocationInput) {
  return (await apiRequest<DataResponse<Location>>('/api/locaciones', {
    method: 'POST',
    body: JSON.stringify(input),
  })).data
}

export async function updateLocation(id: number, input: LocationUpdate) {
  return (await apiRequest<DataResponse<Location>>(`/api/locaciones/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })).data
}

export async function listMachineTypes(signal?: AbortSignal) {
  return (await apiRequest<DataResponse<MachineType[]>>('/api/tipos-maquina', { signal })).data
}

export async function createMachineType(input: MachineTypeInput) {
  return (await apiRequest<DataResponse<MachineType>>('/api/tipos-maquina', {
    method: 'POST',
    body: JSON.stringify(input),
  })).data
}

export async function updateMachineType(id: number, input: MachineTypeInput) {
  return (await apiRequest<DataResponse<MachineType>>(`/api/tipos-maquina/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })).data
}
