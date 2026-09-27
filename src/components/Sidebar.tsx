import type { ElementType } from 'react'
import { Calculator, ChartBar, Cube, CurrencyDollar, FileText, MapPin, Package, Printer, Pulse, Stack, Truck, Users, Wrench } from '@phosphor-icons/react'
import { NavLink } from 'react-router-dom'

type NavItem = {
  to: string
  label: string
  icon: ElementType
}

const NAV_ITEMS: NavItem[] = [
  { to: '/locaciones', label: 'Locaciones', icon: MapPin },
  { to: '/tipos-maquina', label: 'Tipos de maquina', icon: Wrench },
  { to: '/maquinas', label: 'Maquinas', icon: Printer },
  { to: '/estados-maquina', label: 'Estados', icon: Pulse },
  { to: '/materiales', label: 'Materiales', icon: Cube },
  { to: '/tarifas', label: 'Tarifas', icon: CurrencyDollar },
  { to: '/cotizador', label: 'Cotizador', icon: Calculator },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/cotizaciones', label: 'Cotizaciones', icon: FileText },
  { to: '/pedidos', label: 'Pedidos', icon: Truck },
  { to: '/metricas', label: 'Metricas', icon: ChartBar },
  { to: '/componentes', label: 'Componentes', icon: Stack },
]

export default function Sidebar() {
  return (
    <aside className="app-sidebar" aria-label="Navegacion principal">
      <div className="sidebar-header">
        <div className="sidebar-logo" aria-hidden="true">
          <Package size={12} weight="bold" />
        </div>
        <span className="sidebar-brand">Rokishi OS v0.9.0</span>
        <span className="sidebar-environment">admin</span>
      </div>

      <div className="sidebar-section-label">Catalogos</div>
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          {NAV_ITEMS.map((item) => {
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
      </nav>

      <div className="sidebar-footer">Administracion de produccion</div>
    </aside>
  )
}
