import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Badge } from '@cloudflare/kumo/components/badge'
import { Banner } from '@cloudflare/kumo/components/banner'
import { Button } from '@cloudflare/kumo/components/button'
import { Dialog } from '@cloudflare/kumo/components/dialog'
import { Input } from '@cloudflare/kumo/components/input'
import { Select } from '@cloudflare/kumo/components/select'
import { Table } from '@cloudflare/kumo/components/table'
import { ArrowClockwise, PencilSimple, Plus, Power, UserGear } from '@phosphor-icons/react'
import { ApiError } from '../api/client'
import { createUser, listUsers, updateUser, type User, type UserRole } from '../api/security'
import { useAuth } from '../auth/context'
import PageHeader from '../components/PageHeader'

type UserForm = {
  nombre: string
  correo: string
  password: string
  rol: UserRole
}

const EMPTY_FORM: UserForm = { nombre: '', correo: '', password: '', rol: 'OPERADOR' }
const roleItems = [{ value: 'OPERADOR', label: 'Operador' }, { value: 'ADMIN', label: 'Administrador' }]

function formFromUser(user: User): UserForm {
  return { nombre: user.nombre, correo: user.correo, password: '', rol: user.rol }
}

function sortUsers(users: User[]) {
  return [...users].sort((a, b) => a.nombre.localeCompare(b.nombre) || a.id - b.id)
}

export default function UsersPage() {
  const { user: currentUser, refresh } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [success, setSuccess] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState<UserForm>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [togglingID, setTogglingID] = useState<number | null>(null)

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setLoadError('')
    try {
      setUsers(sortUsers(await listUsers(signal)))
    } catch (error) {
      if (!signal?.aborted) setLoadError(error instanceof ApiError ? error.message : 'No se pudieron cargar los usuarios.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(() => { if (!controller.signal.aborted) void load(controller.signal) })
    return () => controller.abort()
  }, [load])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setFormOpen(true)
  }

  function openEdit(user: User) {
    setEditing(user)
    setForm(formFromUser(user))
    setFormError('')
    setFormOpen(true)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    if (!editing && form.password.length < 12) {
      setFormError('La contrasena debe contener al menos 12 caracteres.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const input = { nombre: form.nombre, correo: form.correo, rol: form.rol }
      const saved = editing
        ? await updateUser(editing.id, { ...input, ...(form.password ? { password: form.password } : {}) })
        : await createUser({ ...input, password: form.password })
      setUsers((current) => sortUsers(editing ? current.map((user) => user.id === saved.id ? saved : user) : [...current, saved]))
      if (saved.id === currentUser.id) await refresh()
      setSuccess(editing ? 'El usuario se actualizo correctamente.' : 'El usuario se creo correctamente.')
      setFormOpen(false)
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'No se pudo guardar el usuario.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(user: User) {
    setTogglingID(user.id)
    setLoadError('')
    setSuccess('')
    try {
      const updated = await updateUser(user.id, { activo: !user.activo })
      setUsers((current) => current.map((item) => item.id === updated.id ? updated : item))
      setSuccess(`El usuario quedo ${updated.activo ? 'activo' : 'inactivo'}.`)
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : 'No se pudo cambiar el estado del usuario.')
    } finally {
      setTogglingID(null)
    }
  }

  return (
    <div>
      <PageHeader title="Usuarios" description="Administra el acceso y los roles del equipo." action={<Button variant="primary" icon={Plus} onClick={openCreate}>Nuevo usuario</Button>} />
      <div className="feedback-stack" aria-live="polite">
        {success && <Banner title="Operacion completada" description={success} />}
        {loadError && <Banner variant="error" title="No fue posible completar la solicitud" description={loadError} />}
      </div>

      <section className="catalog-section" aria-label="Listado de usuarios">
        {loading ? <div className="catalog-state" role="status">Cargando usuarios...</div> : loadError && users.length === 0 ? (
          <div className="catalog-state"><strong>Los datos no estan disponibles</strong><Button variant="secondary" size="sm" icon={ArrowClockwise} onClick={() => void load()}>Reintentar</Button></div>
        ) : users.length === 0 ? (
          <div className="catalog-state"><UserGear size={28} aria-hidden="true" /><strong>No hay usuarios</strong></div>
        ) : <div className="table-scroll"><Table>
          <Table.Header><Table.Row><Table.Head>Usuario</Table.Head><Table.Head>Correo</Table.Head><Table.Head>Rol</Table.Head><Table.Head>Estado</Table.Head><Table.Head>Actualizacion</Table.Head><Table.Head><span className="sr-only">Acciones</span></Table.Head></Table.Row></Table.Header>
          <Table.Body>{users.map((user) => <Table.Row key={user.id}>
            <Table.Cell><strong>{user.nombre}</strong>{user.id === currentUser.id && <span className="table-secondary"> Tu cuenta</span>}</Table.Cell>
            <Table.Cell>{user.correo}</Table.Cell>
            <Table.Cell><Badge variant="neutral">{user.rol === 'ADMIN' ? 'Administrador' : 'Operador'}</Badge></Table.Cell>
            <Table.Cell><Badge variant={user.activo ? 'success' : 'neutral'} appearance="dot">{user.activo ? 'Activo' : 'Inactivo'}</Badge></Table.Cell>
            <Table.Cell>{new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(user.fecha_actualizacion))}</Table.Cell>
            <Table.Cell><div className="row-actions"><Button variant="ghost" shape="square" size="sm" icon={PencilSimple} aria-label={`Editar ${user.nombre}`} onClick={() => openEdit(user)} /><Button variant="ghost" shape="square" size="sm" icon={Power} disabled={user.id === currentUser.id} loading={togglingID === user.id} aria-label={`${user.activo ? 'Desactivar' : 'Activar'} ${user.nombre}`} onClick={() => void toggleActive(user)} /></div></Table.Cell>
          </Table.Row>)}</Table.Body>
        </Table></div>}
      </section>

      <Dialog.Root open={formOpen} onOpenChange={setFormOpen}>
        <Dialog size="lg" className="p-8">
          <Dialog.Title>{editing ? 'Editar usuario' : 'Nuevo usuario'}</Dialog.Title>
          <Dialog.Description>{editing ? 'Deja la contrasena vacia para conservar la actual.' : 'La contrasena debe tener al menos 12 caracteres.'}</Dialog.Description>
          <form className="catalog-form" onSubmit={submit}>
            {formError && <Banner size="sm" variant="error" title="Revisa la informacion" description={formError} />}
            <Input label="Nombre *" value={form.nombre} required maxLength={100} autoComplete="name" onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))} />
            <Input label="Correo *" type="email" value={form.correo} required maxLength={254} autoComplete="email" onChange={(event) => setForm((current) => ({ ...current, correo: event.target.value }))} />
            <div className="form-grid">
              <Select label="Rol *" value={form.rol} onValueChange={(value) => setForm((current) => ({ ...current, rol: (value ?? 'OPERADOR') as UserRole }))} items={roleItems} />
              <Input label={editing ? 'Nueva contrasena' : 'Contrasena *'} type="password" value={form.password} required={!editing} minLength={editing ? undefined : 12} maxLength={128} autoComplete="new-password" onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
            </div>
            <div className="dialog-actions"><Dialog.Close render={(props) => <Button type="button" variant="ghost" {...props}>Cancelar</Button>} /><Button type="submit" variant="primary" loading={saving}>{editing ? 'Guardar cambios' : 'Crear usuario'}</Button></div>
          </form>
        </Dialog>
      </Dialog.Root>
    </div>
  )
}
