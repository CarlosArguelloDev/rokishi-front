import type { ReactNode } from 'react'
import Sidebar from '../components/Sidebar'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main" role="main">
        <div className="app-main-inner">{children}</div>
      </main>
    </div>
  )
}
