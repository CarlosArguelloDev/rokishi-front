import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import LocationsPage from './pages/LocationsPage'
import MachinesPage from './pages/MachinesPage'
import MachineStatesPage from './pages/MachineStatesPage'
import MachineTypesPage from './pages/MachineTypesPage'

const ComponentsPage = lazy(() => import('./pages/ComponentsPage'))

export default function App() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/locaciones" replace />} />
        <Route path="/locaciones" element={<LocationsPage />} />
        <Route path="/maquinas" element={<MachinesPage />} />
        <Route path="/estados-maquina" element={<MachineStatesPage />} />
        <Route path="/tipos-maquina" element={<MachineTypesPage />} />
        <Route
          path="/componentes"
          element={<Suspense fallback={<div className="catalog-state">Cargando componentes...</div>}><ComponentsPage /></Suspense>}
        />
        <Route path="*" element={<Navigate to="/locaciones" replace />} />
      </Routes>
    </DashboardLayout>
  )
}
