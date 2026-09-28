import { type FormEvent, useState } from 'react'
import { Banner } from '@cloudflare/kumo/components/banner'
import { Button } from '@cloudflare/kumo/components/button'
import { Input } from '@cloudflare/kumo/components/input'
import { ArrowClockwise, LockKey, Package } from '@phosphor-icons/react'
import { ApiError } from '../api/client'

type AuthPageProps = {
  setupRequired: boolean
  loadError: string
  onRetry: () => Promise<void>
  onLogin: (email: string, password: string) => Promise<void>
  onBootstrap: (code: string, name: string, email: string, password: string) => Promise<void>
}

export default function AuthPage({ setupRequired, loadError, onRetry, onLogin, onBootstrap }: AuthPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [setupCode, setSetupCode] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return
    if (setupRequired && password !== confirmPassword) {
      setFormError('Las contrasenas no coinciden.')
      return
    }
    setSubmitting(true)
    setFormError('')
    try {
      if (setupRequired) {
        await onBootstrap(setupCode, name, email, password)
      } else {
        await onLogin(email, password)
      }
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'No se pudo completar el acceso.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-brand"><span><Package size={18} weight="bold" /></span>Rokishi OS</div>
        <div className="auth-heading">
          <LockKey size={28} aria-hidden="true" />
          <h1 id="auth-title">{setupRequired ? 'Configura el acceso inicial' : 'Inicia sesion'}</h1>
          <p>{setupRequired ? 'Crea el primer administrador con el codigo de los logs de Heroku.' : 'Accede al panel de produccion.'}</p>
        </div>

        {loadError && <Banner variant="error" title="API no disponible" description={loadError} />}
        {formError && <Banner variant="error" title="No fue posible continuar" description={formError} />}

        {loadError ? (
          <Button variant="secondary" icon={ArrowClockwise} onClick={() => void onRetry().catch(() => undefined)}>Reintentar conexion</Button>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            {setupRequired && <Input label="Codigo de configuracion" value={setupCode} required autoComplete="one-time-code" onChange={(event) => setSetupCode(event.target.value)} />}
            {setupRequired && <Input label="Nombre" value={name} required maxLength={100} autoComplete="name" onChange={(event) => setName(event.target.value)} />}
            <Input label="Correo" type="email" value={email} required maxLength={254} autoComplete="email" onChange={(event) => setEmail(event.target.value)} />
            <Input label="Contrasena" type="password" value={password} required minLength={12} maxLength={128} autoComplete={setupRequired ? 'new-password' : 'current-password'} onChange={(event) => setPassword(event.target.value)} />
            {setupRequired && <Input label="Confirmar contrasena" type="password" value={confirmPassword} required minLength={12} maxLength={128} autoComplete="new-password" onChange={(event) => setConfirmPassword(event.target.value)} />}
            <Button type="submit" variant="primary" loading={submitting}>{setupRequired ? 'Crear administrador' : 'Entrar'}</Button>
          </form>
        )}
      </section>
    </main>
  )
}
