import { type FormEvent, useEffect, useState } from 'react'
import { Banner } from '@cloudflare/kumo/components/banner'
import { Button } from '@cloudflare/kumo/components/button'
import { Input } from '@cloudflare/kumo/components/input'
import { Select } from '@cloudflare/kumo/components/select'
import { CurrencyDollar, FloppyDisk, Lightning } from '@phosphor-icons/react'
import { listLocations, type Location } from '../api/catalogs'
import { ApiError } from '../api/client'
import { getEnergyRate, getMachineRate, putEnergyRate, putMachineRate } from '../api/costs'
import { listMachines, type Machine } from '../api/machines'
import PageHeader from '../components/PageHeader'

type MachineRateForm = {
  costo_interno_hora: string
  precio_venta_hora: string
  costo_preparacion: string
}

const EMPTY_MACHINE_RATE: MachineRateForm = {
  costo_interno_hora: '0',
  precio_venta_hora: '0',
  costo_preparacion: '0',
}

export default function RatesPage() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [machineID, setMachineID] = useState('')
  const [locationID, setLocationID] = useState('')
  const [machineForm, setMachineForm] = useState<MachineRateForm>(EMPTY_MACHINE_RATE)
  const [energyCost, setEnergyCost] = useState('')
  const [machineConfigured, setMachineConfigured] = useState(false)
  const [energyConfigured, setEnergyConfigured] = useState(false)
  const [loading, setLoading] = useState(true)
  const [machineLoading, setMachineLoading] = useState(false)
  const [energyLoading, setEnergyLoading] = useState(false)
  const [machineSaving, setMachineSaving] = useState(false)
  const [energySaving, setEnergySaving] = useState(false)
  const [machineError, setMachineError] = useState('')
  const [energyError, setEnergyError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(async () => {
      try {
        const [machineData, locationData] = await Promise.all([
          listMachines({}, controller.signal),
          listLocations(controller.signal),
        ])
        if (controller.signal.aborted) return
        setMachines(machineData)
        setLocations(locationData)
        setMachineID(machineData[0] ? String(machineData[0].id) : '')
        setLocationID(locationData[0] ? String(locationData[0].id) : '')
      } catch (error) {
        if (!controller.signal.aborted) {
          const message = error instanceof ApiError ? error.message : 'No se pudieron cargar maquinas y locaciones.'
          setMachineError(message)
          setEnergyError(message)
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!machineID) {
      return
    }
    const controller = new AbortController()
    queueMicrotask(async () => {
      setMachineLoading(true)
      setMachineError('')
      try {
        const rate = await getMachineRate(Number(machineID), controller.signal)
        if (controller.signal.aborted) return
        if (rate === null) {
          setMachineForm(EMPTY_MACHINE_RATE)
          setMachineConfigured(false)
          return
        }
        setMachineForm({
          costo_interno_hora: String(rate.costo_interno_hora),
          precio_venta_hora: String(rate.precio_venta_hora),
          costo_preparacion: String(rate.costo_preparacion),
        })
        setMachineConfigured(true)
      } catch (error) {
        if (controller.signal.aborted) return
        if (error instanceof ApiError && error.status === 404) {
          setMachineForm(EMPTY_MACHINE_RATE)
          setMachineConfigured(false)
        } else {
          setMachineError(error instanceof ApiError ? error.message : 'No se pudo cargar la tarifa de maquina.')
        }
      } finally {
        if (!controller.signal.aborted) setMachineLoading(false)
      }
    })
    return () => controller.abort()
  }, [machineID])

  useEffect(() => {
    if (!locationID) {
      return
    }
    const controller = new AbortController()
    queueMicrotask(async () => {
      setEnergyLoading(true)
      setEnergyError('')
      try {
        const rate = await getEnergyRate(Number(locationID), controller.signal)
        if (controller.signal.aborted) return
        if (rate === null) {
          setEnergyCost('')
          setEnergyConfigured(false)
          return
        }
        setEnergyCost(String(rate.costo_por_kwh))
        setEnergyConfigured(true)
      } catch (error) {
        if (controller.signal.aborted) return
        if (error instanceof ApiError && error.status === 404) {
          setEnergyCost('')
          setEnergyConfigured(false)
        } else {
          setEnergyError(error instanceof ApiError ? error.message : 'No se pudo cargar la tarifa electrica.')
        }
      } finally {
        if (!controller.signal.aborted) setEnergyLoading(false)
      }
    })
    return () => controller.abort()
  }, [locationID])

  function updateMachineField(field: keyof MachineRateForm, value: string) {
    setMachineForm((current) => ({ ...current, [field]: value }))
  }

  async function saveMachineRate(event: FormEvent) {
    event.preventDefault()
    if (!machineID || machineSaving) return
    const values = [machineForm.costo_interno_hora, machineForm.precio_venta_hora, machineForm.costo_preparacion].map(Number)
    if (values.some((value) => !Number.isFinite(value) || value < 0)) {
      setMachineError('Todos los importes deben ser numeros mayores o iguales a cero.')
      return
    }
    setMachineSaving(true)
    setMachineError('')
    try {
      const rate = await putMachineRate(Number(machineID), {
        costo_interno_hora: values[0], precio_venta_hora: values[1], costo_preparacion: values[2],
      })
      setMachineConfigured(true)
      setMachineForm({
        costo_interno_hora: String(rate.costo_interno_hora),
        precio_venta_hora: String(rate.precio_venta_hora),
        costo_preparacion: String(rate.costo_preparacion),
      })
      setSuccess('La tarifa de maquina se guardo correctamente.')
    } catch (error) {
      setMachineError(error instanceof ApiError ? error.message : 'No se pudo guardar la tarifa de maquina.')
    } finally {
      setMachineSaving(false)
    }
  }

  async function saveEnergyRate(event: FormEvent) {
    event.preventDefault()
    if (!locationID || energySaving) return
    const value = Number(energyCost)
    if (energyCost === '' || !Number.isFinite(value) || value < 0) {
      setEnergyError('El costo por kWh debe ser un numero mayor o igual a cero.')
      return
    }
    setEnergySaving(true)
    setEnergyError('')
    try {
      const rate = await putEnergyRate(Number(locationID), value)
      setEnergyConfigured(true)
      setEnergyCost(String(rate.costo_por_kwh))
      setSuccess('La tarifa electrica se guardo correctamente.')
    } catch (error) {
      setEnergyError(error instanceof ApiError ? error.message : 'No se pudo guardar la tarifa electrica.')
    } finally {
      setEnergySaving(false)
    }
  }

  const machineItems = machines.map((machine) => ({ value: String(machine.id), label: `${machine.codigo} - ${machine.nombre}` }))
  const locationItems = locations.map((location) => ({ value: String(location.id), label: `${location.codigo} - ${location.nombre}` }))

  return (
    <div>
      <PageHeader title="Tarifas" description="Configura los costos operativos que usara el cotizador." action={<span />} />
      <div className="feedback-stack" aria-live="polite">{success && <Banner title="Tarifa actualizada" description={success} />}</div>

      <section className="rate-section" aria-labelledby="machine-rate-title">
        <div className="rate-section-heading">
          <div className="rate-icon"><CurrencyDollar size={18} aria-hidden="true" /></div>
          <div><h2 id="machine-rate-title">Tarifa por maquina</h2><p>Importes por hora y costo fijo de preparacion.</p></div>
        </div>
        <form className="rate-form" onSubmit={saveMachineRate}>
          {machineError && <Banner size="sm" variant="error" title="Tarifa no disponible" description={machineError} />}
          <Select label="Maquina" placeholder={loading ? 'Cargando...' : 'Selecciona una maquina'} value={machineID} onValueChange={(value) => { setMachineID(value ?? ''); setSuccess('') }} items={machineItems} />
          <div className="rate-status">{machineLoading ? 'Consultando tarifa...' : machineConfigured ? 'Tarifa configurada' : 'Sin tarifa configurada'}</div>
          <div className="rate-inputs">
            <Input label="Costo interno por hora" type="number" min="0" step="0.01" value={machineForm.costo_interno_hora} onChange={(event) => updateMachineField('costo_interno_hora', event.target.value)} />
            <Input label="Precio de venta por hora" type="number" min="0" step="0.01" value={machineForm.precio_venta_hora} onChange={(event) => updateMachineField('precio_venta_hora', event.target.value)} />
            <Input label="Costo de preparacion" type="number" min="0" step="0.01" value={machineForm.costo_preparacion} onChange={(event) => updateMachineField('costo_preparacion', event.target.value)} />
          </div>
          <div className="rate-actions"><Button type="submit" variant="primary" icon={FloppyDisk} loading={machineSaving} disabled={!machineID || machineLoading}>Guardar tarifa</Button></div>
        </form>
      </section>

      <section className="rate-section" aria-labelledby="energy-rate-title">
        <div className="rate-section-heading">
          <div className="rate-icon rate-icon-energy"><Lightning size={18} aria-hidden="true" /></div>
          <div><h2 id="energy-rate-title">Tarifa electrica</h2><p>Costo de energia por locacion y kilowatt-hora.</p></div>
        </div>
        <form className="rate-form" onSubmit={saveEnergyRate}>
          {energyError && <Banner size="sm" variant="error" title="Tarifa no disponible" description={energyError} />}
          <Select label="Locacion" placeholder={loading ? 'Cargando...' : 'Selecciona una locacion'} value={locationID} onValueChange={(value) => { setLocationID(value ?? ''); setSuccess('') }} items={locationItems} />
          <div className="rate-status">{energyLoading ? 'Consultando tarifa...' : energyConfigured ? 'Tarifa configurada' : 'Sin tarifa configurada'}</div>
          <div className="rate-inputs rate-inputs-single"><Input label="Costo por kWh" type="number" min="0" step="0.0001" value={energyCost} onChange={(event) => setEnergyCost(event.target.value)} /></div>
          <div className="rate-actions"><Button type="submit" variant="primary" icon={FloppyDisk} loading={energySaving} disabled={!locationID || energyLoading}>Guardar tarifa</Button></div>
        </form>
      </section>
    </div>
  )
}
