import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '../api/client'
import {
  bootstrap as bootstrapRequest,
  getAuthStatus,
  login as loginRequest,
  logout as logoutRequest,
  type User,
} from '../api/security'
import AuthPage from '../pages/AuthPage'
import { AuthContext } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [setupRequired, setSetupRequired] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const refresh = useCallback(async () => {
    try {
      const status = await getAuthStatus()
      setUser(status.usuario)
      setSetupRequired(status.configuracion_requerida)
      setLoadError('')
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : 'No se pudo consultar el acceso a Rokishi.')
      throw error
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(async () => {
      try {
        const status = await getAuthStatus(controller.signal)
        if (!controller.signal.aborted) {
          setUser(status.usuario)
          setSetupRequired(status.configuracion_requerida)
          setLoadError('')
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(error instanceof ApiError ? error.message : 'No se pudo consultar el acceso a Rokishi.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => setUser(null)
    window.addEventListener('rokishi:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('rokishi:unauthorized', handleUnauthorized)
  }, [])

  async function login(correo: string, password: string) {
    const authenticated = await loginRequest(correo, password)
    setUser(authenticated)
    setSetupRequired(false)
  }

  async function bootstrap(codigo: string, nombre: string, correo: string, password: string) {
    const authenticated = await bootstrapRequest(codigo, { nombre, correo, password })
    setUser(authenticated)
    setSetupRequired(false)
  }

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(() => user ? { user, refresh, logout } : null, [user, refresh, logout])

  if (loading) return <div className="auth-state" role="status">Validando acceso...</div>
  if (!user) {
    return <AuthPage setupRequired={setupRequired} loadError={loadError} onRetry={refresh} onLogin={login} onBootstrap={bootstrap} />
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
