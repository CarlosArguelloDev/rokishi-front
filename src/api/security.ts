import { apiRequest } from './client'

type DataResponse<T> = {
  data: T
}

export type UserRole = 'ADMIN' | 'OPERADOR'

export type User = {
  id: number
  nombre: string
  correo: string
  rol: UserRole
  activo: boolean
  fecha_creacion: string
  fecha_actualizacion: string
}

export type AuthStatus = {
  configuracion_requerida: boolean
  usuario: User | null
}

export type CreateUserInput = {
  nombre: string
  correo: string
  password: string
  rol: UserRole
}

export type UpdateUserInput = Partial<CreateUserInput> & {
  activo?: boolean
}

export type AuditEntry = {
  id: number
  usuario_id: number | null
  usuario_nombre: string
  accion: string
  recurso: string
  estado_http: number
  direccion_ip: string | null
  agente_usuario: string | null
  fecha: string
}

export async function getAuthStatus(signal?: AbortSignal) {
  return (await apiRequest<DataResponse<AuthStatus>>('/api/auth/status', { signal })).data
}

export async function login(correo: string, password: string) {
  return (await apiRequest<DataResponse<User>>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ correo, password }),
  })).data
}

export async function bootstrap(codigoConfiguracion: string, input: Omit<CreateUserInput, 'rol'>) {
  return (await apiRequest<DataResponse<User>>('/api/auth/bootstrap', {
    method: 'POST',
    body: JSON.stringify({ codigo_configuracion: codigoConfiguracion, ...input }),
  })).data
}

export async function logout() {
  await apiRequest<DataResponse<{ sesion_cerrada: boolean }>>('/api/auth/logout', { method: 'POST' })
}

export async function listUsers(signal?: AbortSignal) {
  return (await apiRequest<DataResponse<User[]>>('/api/usuarios', { signal })).data
}

export async function createUser(input: CreateUserInput) {
  return (await apiRequest<DataResponse<User>>('/api/usuarios', {
    method: 'POST',
    body: JSON.stringify(input),
  })).data
}

export async function updateUser(id: number, input: UpdateUserInput) {
  return (await apiRequest<DataResponse<User>>(`/api/usuarios/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })).data
}

export async function listAudit(limit = 100, signal?: AbortSignal) {
  return (await apiRequest<DataResponse<AuditEntry[]>>(`/api/auditoria?limite=${limit}`, { signal })).data
}
