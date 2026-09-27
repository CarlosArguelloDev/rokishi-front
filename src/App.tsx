import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import CustomersPage from './pages/CustomersPage'
import LocationsPage from './pages/LocationsPage'
import MachinesPage from './pages/MachinesPage'
import MachineStatesPage from './pages/MachineStatesPage'
import MachineTypesPage from './pages/MachineTypesPage'
import MaterialsPage from './pages/MaterialsPage'
import OrdersPage from './pages/OrdersPage'
import QuoteCalculatorPage from './pages/QuoteCalculatorPage'
import QuotesPage from './pages/QuotesPage'
import RatesPage from './pages/RatesPage'

const ComponentsPage = lazy(() => import('./pages/ComponentsPage'))

export default function App() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/locaciones" replace />} />
        <Route path="/locaciones" element={<LocationsPage />} />
        <Route path="/maquinas" element={<MachinesPage />} />
        <Route path="/estados-maquina" element={<MachineStatesPage />} />
        <Route path="/materiales" element={<MaterialsPage />} />
        <Route path="/tarifas" element={<RatesPage />} />
        <Route path="/cotizador" element={<QuoteCalculatorPage />} />
        <Route path="/clientes" element={<CustomersPage />} />
        <Route path="/cotizaciones" element={<QuotesPage />} />
        <Route path="/pedidos" element={<OrdersPage />} />
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
