import { useCallback, useEffect, useState } from 'react'
import { Banner } from '@cloudflare/kumo/components/banner'
import { Button } from '@cloudflare/kumo/components/button'
import { Table } from '@cloudflare/kumo/components/table'
import { ArrowClockwise, ClipboardText } from '@phosphor-icons/react'
import { ApiError } from '../api/client'
import { listAudit, type AuditEntry } from '../api/security'
import PageHeader from '../components/PageHeader'

const dateFormatter = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' })

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setLoadError('')
    try {
      setEntries(await listAudit(100, signal))
    } catch (error) {
      if (!signal?.aborted) setLoadError(error instanceof ApiError ? error.message : 'No se pudo cargar la auditoria.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(() => { if (!controller.signal.aborted) void load(controller.signal) })
    return () => controller.abort()
  }, [load])

  return (
    <div>
      <PageHeader title="Auditoria" description="Consulta las ultimas acciones que modificaron informacion." action={<Button variant="secondary" icon={ArrowClockwise} loading={loading} onClick={() => void load()}>Actualizar</Button>} />
      {loadError && <div className="feedback-stack"><Banner variant="error" title="Auditoria no disponible" description={loadError} /></div>}
      <section className="catalog-section" aria-label="Registro de auditoria">
        {loading && entries.length === 0 ? <div className="catalog-state" role="status">Cargando auditoria...</div> : entries.length === 0 ? (
          <div className="catalog-state"><ClipboardText size={28} aria-hidden="true" /><strong>No hay acciones registradas</strong><span>Las modificaciones exitosas apareceran aqui.</span></div>
        ) : <div className="table-scroll"><Table>
          <Table.Header><Table.Row><Table.Head>Fecha</Table.Head><Table.Head>Usuario</Table.Head><Table.Head>Accion</Table.Head><Table.Head>Recurso</Table.Head><Table.Head>Estado</Table.Head><Table.Head>IP</Table.Head></Table.Row></Table.Header>
          <Table.Body>{entries.map((entry) => <Table.Row key={entry.id}>
            <Table.Cell>{dateFormatter.format(new Date(entry.fecha))}</Table.Cell>
            <Table.Cell><strong>{entry.usuario_nombre}</strong></Table.Cell>
            <Table.Cell><span className="catalog-code">{entry.accion}</span></Table.Cell>
            <Table.Cell><code className="audit-resource">{entry.recurso}</code></Table.Cell>
            <Table.Cell>{entry.estado_http}</Table.Cell>
            <Table.Cell>{entry.direccion_ip || 'No disponible'}</Table.Cell>
          </Table.Row>)}</Table.Body>
        </Table></div>}
      </section>
    </div>
  )
}
