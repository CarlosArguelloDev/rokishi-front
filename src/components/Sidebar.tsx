import type { ElementType } from 'react'
import { Calculator, ChartBar, ClipboardText, Cube, CurrencyDollar, FileText, MapPin, Package, Printer, Pulse, ShieldCheck, SignOut, Stack, Truck, Users, Wrench } from '@phosphor-icons/react'
import { NavLink } from 'react-router-dom'
import { Button } from '@cloudflare/kumo/components/button'
import { useState } from 'react'
import { useAuth } from '../auth/context'

type NavItem = {
  to: string
  label: string
  icon: ElementType
  adminOnly?: boolean
}

type NavSection = {
  id: string
  label: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    id: 'operacion',
    label: 'Operacion',
    items: [
      { to: '/pedidos', label: 'Pedidos', icon: Truck },
      { to: '/cotizador', label: 'Cotizador', icon: Calculator },
      { to: '/cotizaciones', label: 'Cotizaciones', icon: FileText },
      { to: '/clientes', label: 'Clientes', icon: Users },
    ],
  },
  {
    id: 'produccion',
    label: 'Produccion',
    items: [
      { to: '/maquinas', label: 'Maquinas', icon: Printer },
      { to: '/estados-maquina', label: 'Estados', icon: Pulse },
      { to: '/materiales', label: 'Materiales', icon: Cube },
    ],
  },
  {
    id: 'analisis',
    label: 'Analisis',
    items: [{ to: '/metricas', label: 'Metricas', icon: ChartBar }],
  },
  {
    id: 'configuracion',
    label: 'Configuracion',
    items: [
      { to: '/locaciones', label: 'Locaciones', icon: MapPin },
      { to: '/tipos-maquina', label: 'Tipos de maquina', icon: Wrench },
      { to: '/tarifas', label: 'Tarifas', icon: CurrencyDollar },
    ],
  },
  {
    id: 'administracion',
    label: 'Administracion',
    items: [
      { to: '/usuarios', label: 'Usuarios', icon: ShieldCheck, adminOnly: true },
      { to: '/auditoria', label: 'Auditoria', icon: ClipboardText, adminOnly: true },
    ],
  },
  {
    id: 'herramientas',
    label: 'Herramientas',
    items: [{ to: '/componentes', label: 'Componentes', icon: Stack }],
  },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)
  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.adminOnly || user.rol === 'ADMIN'),
  })).filter((section) => section.items.length > 0)

  async function closeSession() {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <aside className="app-sidebar" aria-label="Navegacion principal">
      <div className="sidebar-header">
        <div className="sidebar-logo" aria-hidden="true">
          <Package size={12} weight="bold" />
        </div>
        <span className="sidebar-brand">Rokishi OS v1.0.0</span>
        <span className="sidebar-environment">{user.rol === 'ADMIN' ? 'admin' : 'operador'}</span>
        <Button className="sidebar-logout" variant="ghost" shape="square" size="sm" icon={SignOut} loading={loggingOut} aria-label="Cerrar sesion" onClick={() => void closeSession()} />
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-groups">
          {sections.map((section) => (
            <section className="sidebar-group" aria-labelledby={`sidebar-${section.id}`} key={section.id}>
              <h2 className="sidebar-section-label" id={`sidebar-${section.id}`}>{section.label}</h2>
              <ul className="sidebar-menu">
                {section.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        className={({ isActive }) => `sidebar-link${isActive ? ' sidebar-link-active' : ''}`}
                      >
                        <Icon size={16} weight="regular" aria-hidden="true" />
                        <span>{item.label}</span>
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      </nav>

      <div className="sidebar-footer"><strong>{user.nombre}</strong><span>{user.correo}</span></div>
    </aside>
  )
}
