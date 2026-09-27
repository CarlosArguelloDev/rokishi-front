import { apiRequest } from './client'

type DataResponse<T> = {
  data: T
}

export type Customer = {
  id: number
  nombre: string
  correo: string | null
  telefono: string | null
  notas: string | null
  activo: boolean
  fecha_creacion: string
  fecha_actualizacion: string
}

export type CustomerInput = {
  nombre: string
  correo?: string | null
  telefono?: string | null
  notas?: string | null
}

export type CustomerUpdate = Partial<CustomerInput> & {
  activo?: boolean
}

export type CustomerFilters = {
  activo?: boolean
  q?: string
}

export async function listCustomers(filters: CustomerFilters = {}, signal?: AbortSignal) {
  const query = new URLSearchParams()
  if (filters.activo !== undefined) query.set('activo', String(filters.activo))
  if (filters.q?.trim()) query.set('q', filters.q.trim())
  const suffix = query.size ? `?${query.toString()}` : ''
  return (await apiRequest<DataResponse<Customer[]>>(`/api/clientes${suffix}`, { signal })).data
}

export async function createCustomer(input: CustomerInput) {
  return (await apiRequest<DataResponse<Customer>>('/api/clientes', {
    method: 'POST',
    body: JSON.stringify(input),
  })).data
}

export async function updateCustomer(id: number, input: CustomerUpdate) {
  return (await apiRequest<DataResponse<Customer>>(`/api/clientes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })).data
}
