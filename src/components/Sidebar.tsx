import {
  ChartBar,
  Cube,
  Gear,
  Package,
  Printer,
  ShoppingCart,
  Stack,
  UserCircle,
  Wrench,
} from '@phosphor-icons/react'

type NavItem = {
  id: string
  label: string
  icon: React.ElementType
  active?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: ChartBar },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'products', label: 'Products', icon: Cube },
  { id: 'customers', label: 'Customers', icon: UserCircle },
  { id: 'production', label: 'Production', icon: Wrench },
  { id: 'printers', label: 'Printers', icon: Printer },
  { id: 'inventory', label: 'Inventory', icon: Stack },
  { id: 'settings', label: 'Settings', icon: Gear },
]

export default function Sidebar() {
  return (
    <aside className="app-sidebar" aria-label="Main navigation">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          padding: '0 1rem',
          height: '48px',
          borderBottom: '1px solid var(--color-kumo-hairline)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '5px',
            background: 'var(--color-kumo-default)',
            display: 'grid',
            placeItems: 'center',
          }}
          aria-hidden="true"
        >
          <Package size={12} weight="bold" color="var(--color-kumo-canvas)" />
        </div>
        <span
          style={{
            fontWeight: 600,
            fontSize: '0.875rem',
            color: 'var(--color-kumo-default)',
            letterSpacing: '-0.01em',
          }}
        >
          Rokishi OS
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '0.625rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--color-kumo-subtle)',
            background: 'var(--color-kumo-fill)',
            padding: '2px 6px',
            borderRadius: '4px',
            border: '1px solid var(--color-kumo-line)',
          }}
        >
          dev
        </span>
      </div>

      {/* Section label */}
      <div style={{ padding: '1rem 1rem 0.375rem' }}>
        <span className="section-title">Navigation</span>
      </div>

      {/* Nav items */}
      <nav style={{ padding: '0 0.5rem', flex: 1 }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = item.id === 'components'
            return (
              <li key={item.id}>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  aria-current={isActive ? 'page' : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    padding: '0.4rem 0.625rem',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '0.8125rem',
                    fontWeight: 450,
                    color: 'var(--color-kumo-subtle)',
                    transition: 'background 0.12s, color 0.12s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = 'var(--color-kumo-tint)'
                    el.style.color = 'var(--color-kumo-default)'
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = ''
                    el.style.color = 'var(--color-kumo-subtle)'
                  }}
                >
                  <Icon size={15} weight="regular" aria-hidden="true" />
                  {item.label}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Components active item */}
      <div style={{ padding: '0 0.5rem 0.25rem' }}>
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          aria-current="page"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.4rem 0.625rem',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '0.8125rem',
            fontWeight: 500,
            color: 'var(--color-kumo-default)',
            background: 'var(--color-kumo-tint)',
            border: '1px solid var(--color-kumo-line)',
          }}
        >
          <Stack size={15} weight="fill" aria-hidden="true" />
          Components
        </a>
      </div>

      {/* Footer version info */}
      <div
        style={{
          padding: '0.75rem 1rem',
          borderTop: '1px solid var(--color-kumo-hairline)',
          marginTop: '0.5rem',
        }}
      >
        <p
          style={{
            fontSize: '0.6875rem',
            color: 'var(--color-kumo-subtle)',
            margin: 0,
          }}
        >
          Kumo v2.13.2 · UI Playground
        </p>
      </div>
    </aside>
  )
}
