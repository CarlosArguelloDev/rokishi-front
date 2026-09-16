import { useState } from 'react'

// ─── Kumo Components ──────────────────────────────────────────────────────────
import { Badge } from '@cloudflare/kumo/components/badge'
import { Banner } from '@cloudflare/kumo/components/banner'
import { Breadcrumbs } from '@cloudflare/kumo/components/breadcrumbs'
import { Button } from '@cloudflare/kumo/components/button'
import { Checkbox } from '@cloudflare/kumo/components/checkbox'
import { Dialog } from '@cloudflare/kumo/components/dialog'
import { DropdownMenu } from '@cloudflare/kumo/components/dropdown'
import { Input, InputGroup, Textarea } from '@cloudflare/kumo/components/input'
import { LayerCard } from '@cloudflare/kumo/components/layer-card'
import { Meter } from '@cloudflare/kumo/components/meter'
import { Pagination } from '@cloudflare/kumo/components/pagination'
import { Radio } from '@cloudflare/kumo/components/radio'
import { Select } from '@cloudflare/kumo/components/select'
import { Switch } from '@cloudflare/kumo/components/switch'
import { Table } from '@cloudflare/kumo/components/table'
import { Tabs } from '@cloudflare/kumo/components/tabs'
import { Tooltip, TooltipProvider } from '@cloudflare/kumo/components/tooltip'

// ─── Icons ────────────────────────────────────────────────────────────────────
import {
  ArrowDown,
  ArrowUp,
  CopySimple,
  DotsThree,
  MagnifyingGlass,
  Package,
  PencilSimple,
  Printer,
  TrashSimple,
  Warning,
} from '@phosphor-icons/react'

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="showcase-section" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`} className="section-title">
        {title}
      </h2>
      {children}
    </section>
  )
}

// ─── Fake data ────────────────────────────────────────────────────────────────
const ORDERS = [
  { id: '#1042', customer: 'Acme Corp', material: 'PLA', status: 'In Production', printer: 'Printer 01', progress: 68 },
  { id: '#1043', customer: 'Studio Zero', material: 'PETG', status: 'Completed', printer: 'Printer 02', progress: 100 },
  { id: '#1044', customer: 'Fab Lab MX', material: 'ABS', status: 'Pending', printer: '—', progress: 0 },
  { id: '#1045', customer: 'Makespace', material: 'TPU', status: 'Failed', printer: 'Printer 03', progress: 22 },
]

function statusVariant(status: string) {
  switch (status) {
    case 'Completed': return 'success' as const
    case 'In Production': return 'info' as const
    case 'Pending': return 'warning' as const
    case 'Failed': return 'error' as const
    default: return 'neutral' as const
  }
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ComponentsPage() {
  // State for interactive components
  const [activeTab, setActiveTab] = useState('pla')
  const [page, setPage] = useState(1)
  const [meterValue] = useState(68)
  const [switchOn, setSwitchOn] = useState(true)
  const [checkbox1, setCheckbox1] = useState(true)
  const [checkbox2, setCheckbox2] = useState(false)
  const [radio, setRadio] = useState('pla')
  const [searchValue, setSearchValue] = useState('')
  const [textareaValue, setTextareaValue] = useState('PLA filament, 1kg spool, white color.\nDelivery by Friday.')
  const [selectValue, setSelectValue] = useState('pla')
  const perPage = 10

  return (
    <TooltipProvider>
      <div>
        {/* Page header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <Breadcrumbs>
            <Breadcrumbs.Link href="#">Rokishi OS</Breadcrumbs.Link>
            <Breadcrumbs.Separator />
            <Breadcrumbs.Current>Components</Breadcrumbs.Current>
          </Breadcrumbs>
          <h1
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              margin: '0.75rem 0 0.375rem',
              color: 'var(--color-kumo-default)',
              letterSpacing: '-0.02em',
            }}
          >
            Components Showcase
          </h1>
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--color-kumo-subtle)',
              margin: 0,
            }}
          >
            Cloudflare Kumo UI component library reference adapted for Rokishi 3D printing platform.
          </p>
        </div>

        {/* ── BUTTONS ── */}
        <Section id="buttons" title="Buttons">
          <div className="showcase-row" style={{ marginBottom: '0.75rem' }}>
            <Button variant="primary">Start Print Job</Button>
            <Button variant="secondary">Export Report</Button>
            <Button variant="ghost">View Details</Button>
            <Button variant="destructive">Cancel Order</Button>
            <Button variant="outline">Archive</Button>
            <Button variant="secondary-destructive">Remove Printer</Button>
          </div>
          <div className="showcase-row" style={{ marginBottom: '0.75rem' }}>
            <Button variant="primary" size="sm">Small Primary</Button>
            <Button variant="secondary" size="sm">Small Secondary</Button>
            <Button variant="ghost" size="sm">Small Ghost</Button>
          </div>
          <div className="showcase-row">
            <Button variant="primary" icon={Printer}>Start Print</Button>
            <Button variant="secondary" icon={Package}>New Order</Button>
            <Button variant="primary" loading>Processing…</Button>
            <Button variant="secondary" disabled>Disabled</Button>
            <Button variant="primary" shape="square" icon={PencilSimple} aria-label="Edit" />
            <Button variant="ghost" shape="square" icon={DotsThree} aria-label="More actions" />
          </div>
        </Section>

        {/* ── INPUTS ── */}
        <Section id="inputs" title="Inputs">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <Input label="Order ID" placeholder="e.g. #1042" defaultValue="#1042" />
            </div>
            <div>
              <Input label="Printer Serial (read-only)" defaultValue="PRN-20240901-01" disabled />
            </div>
            <div>
              <Input label="Layer Height (mm)" defaultValue="0.2" placeholder="0.1 - 0.4" />
            </div>
          </div>
        </Section>

        {/* ── SEARCH ── */}
        <Section id="search" title="Search Input">
          <div style={{ maxWidth: '360px' }}>
            <InputGroup>
              <InputGroup.Addon align="start">
                <MagnifyingGlass size={16} />
              </InputGroup.Addon>
              <InputGroup.Input
                placeholder="Search orders, printers, materials…"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                aria-label="Search"
              />
            </InputGroup>
          </div>
        </Section>

        {/* ── SELECT ── */}
        <Section id="select" title="Select">
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ minWidth: '220px' }}>
              <Select
                label="Filament Material"
                value={selectValue}
                onValueChange={(v) => setSelectValue(v ?? 'pla')}
                items={[
                  { value: 'pla', label: 'PLA — Standard' },
                  { value: 'petg', label: 'PETG — Flexible' },
                  { value: 'abs', label: 'ABS — High Temp' },
                  { value: 'tpu', label: 'TPU — Elastic' },
                  { value: 'nylon', label: 'Nylon — Engineering' },
                ]}
              />
            </div>
            <div style={{ minWidth: '220px' }}>
              <Select
                label="Assign Printer"
                items={[
                  { value: 'p01', label: 'Printer 01 — Available' },
                  { value: 'p02', label: 'Printer 02 — Busy' },
                  { value: 'p03', label: 'Printer 03 — Offline' },
                ]}
                placeholder="Select printer..."
              />
            </div>
          </div>
        </Section>

        {/* ── CHECKBOX ── */}
        <Section id="checkbox" title="Checkbox">
          <div className="showcase-row">
            <Checkbox
              checked={checkbox1}
              onCheckedChange={(v) => setCheckbox1(!!v)}
              label="Auto-notify customer on completion"
            />
            <Checkbox
              checked={checkbox2}
              onCheckedChange={(v) => setCheckbox2(!!v)}
              label="Rush order (+20% surcharge)"
            />
            <Checkbox
              checked
              disabled
              label="Bed leveling (automatic)"
            />
          </div>
        </Section>

        {/* ── RADIO ── */}
        <Section id="radio" title="Radio">
          <Radio.Group
            value={radio}
            onValueChange={(v) => setRadio(v)}
            legend="Select Filament Type"
          >
            <Radio.Item value="pla" label="PLA — Biodegradable, easy to print" />
            <Radio.Item value="petg" label="PETG — Durable, food-safe" />
            <Radio.Item value="abs" label="ABS — Heat resistant, solvent-weldable" />
            <Radio.Item value="tpu" label="TPU — Flexible, impact resistant" />
          </Radio.Group>
        </Section>

        {/* ── SWITCH ── */}
        <Section id="switch" title="Switch">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Switch
              id="sw-autoscale"
              checked={switchOn}
              onCheckedChange={(v) => setSwitchOn(!!v)}
              label="Auto-scale model to bed"
            />
            <Switch
              id="sw-supports"
              label="Generate support structures"
            />
            <Switch
              id="sw-disabled"
              checked
              disabled
              label="Bed heating (hardware controlled)"
            />
          </div>
        </Section>

        {/* ── TEXTAREA ── */}
        <Section id="textarea" title="Textarea">
          <div style={{ maxWidth: '480px' }}>
            <label
              htmlFor="textarea-notes"
              style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-kumo-default)', marginBottom: '0.375rem' }}
            >
              Order Notes
            </label>
            <Textarea
              id="textarea-notes"
              rows={4}
              value={textareaValue}
              onChange={(e) => setTextareaValue(e.target.value)}
              placeholder="Add notes for this print job…"
            />
          </div>
        </Section>

        {/* ── BADGES ── */}
        <Section id="badges" title="Badges">
          <div style={{ marginBottom: '0.75rem' }}>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-kumo-subtle)', marginBottom: '0.5rem', fontWeight: 500 }}>
              STATUS — Filled
            </p>
            <div className="showcase-row">
              <Badge variant="success">Completed</Badge>
              <Badge variant="info">In Production</Badge>
              <Badge variant="warning">Pending</Badge>
              <Badge variant="error">Failed</Badge>
              <Badge variant="neutral">Archived</Badge>
              <Badge variant="secondary">Draft</Badge>
            </div>
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-kumo-subtle)', marginBottom: '0.5rem', fontWeight: 500 }}>
              STATUS — Dot
            </p>
            <div className="showcase-row">
              <Badge variant="success" appearance="dot">Online</Badge>
              <Badge variant="warning" appearance="dot">Idle</Badge>
              <Badge variant="error" appearance="dot">Offline</Badge>
              <Badge variant="neutral" appearance="dot">Unknown</Badge>
            </div>
          </div>
          <div>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-kumo-subtle)', marginBottom: '0.5rem', fontWeight: 500 }}>
              MATERIALS — Color coded
            </p>
            <div className="showcase-row">
              <Badge variant="teal">PLA</Badge>
              <Badge variant="blue">PETG</Badge>
              <Badge variant="orange">ABS</Badge>
              <Badge variant="purple">TPU</Badge>
              <Badge variant="green">Nylon</Badge>
              <Badge variant="outline">Resin</Badge>
              <Badge variant="beta">New Material</Badge>
            </div>
          </div>
        </Section>

        {/* ── CARDS ── */}
        <Section id="cards" title="Cards">
          <div className="showcase-grid">
            {ORDERS.slice(0, 3).map((order) => (
              <LayerCard key={order.id} className="p-4 rounded-xl border border-[var(--color-kumo-hairline)] bg-[var(--color-kumo-surface)]">
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.25rem', color: 'var(--color-kumo-default)' }}>
                  Order {order.id}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-kumo-subtle)', marginBottom: '0.75rem' }}>
                  Customer: {order.customer}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                  <Badge variant="teal">{order.material}</Badge>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-kumo-subtle)', margin: '0 0 1rem' }}>
                  Assigned: {order.printer}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button variant="ghost" size="sm">View Order</Button>
                  <Button variant="ghost" size="sm" icon={DotsThree} shape="square" aria-label="More options" />
                </div>
              </LayerCard>
            ))}
          </div>
        </Section>

        {/* ── TABLES ── */}
        <Section id="tables" title="Tables">
          <div style={{ border: '1px solid var(--color-kumo-hairline)', borderRadius: '8px', overflow: 'hidden' }}>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Order</Table.Head>
                  <Table.Head>Customer</Table.Head>
                  <Table.Head>Material</Table.Head>
                  <Table.Head>Printer</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head>Progress</Table.Head>
                  <Table.Head style={{ width: '48px' }} />
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {ORDERS.map((order) => (
                  <Table.Row key={order.id}>
                    <Table.Cell>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', fontWeight: 500 }}>
                        {order.id}
                      </span>
                    </Table.Cell>
                    <Table.Cell style={{ fontSize: '0.8125rem' }}>{order.customer}</Table.Cell>
                    <Table.Cell>
                      <Badge variant="teal">{order.material}</Badge>
                    </Table.Cell>
                    <Table.Cell style={{ fontSize: '0.8125rem', color: 'var(--color-kumo-subtle)' }}>
                      {order.printer}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Meter
                          label={`Progress for ${order.id}`}
                          value={order.progress}
                          showValue={false}
                          style={{ width: '80px' }}
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-kumo-subtle)', minWidth: '2.5rem' }}>
                          {order.progress}%
                        </span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <DropdownMenu>
                        <DropdownMenu.Trigger>
                          <Button variant="ghost" shape="square" icon={DotsThree} size="sm" aria-label="Order actions" />
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content>
                          <DropdownMenu.Item icon={PencilSimple}>Edit Order</DropdownMenu.Item>
                          <DropdownMenu.Item icon={CopySimple}>Duplicate</DropdownMenu.Item>
                          <DropdownMenu.Separator />
                          <DropdownMenu.Item icon={TrashSimple} variant="danger">Delete</DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        </Section>

        {/* ── TABS ── */}
        <Section id="tabs" title="Tabs">
          <div style={{ marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-kumo-subtle)', marginBottom: '0.625rem', fontWeight: 500 }}>
              SEGMENTED (default)
            </p>
            <Tabs
              variant="segmented"
              value={activeTab}
              onValueChange={setActiveTab}
              tabs={[
                { value: 'pla', label: 'PLA' },
                { value: 'petg', label: 'PETG' },
                { value: 'abs', label: 'ABS' },
                { value: 'tpu', label: 'TPU' },
                { value: 'nylon', label: 'Nylon' },
              ]}
            />
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                background: 'var(--color-kumo-fill)',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                color: 'var(--color-kumo-subtle)',
              }}
            >
              Active tab: <strong style={{ color: 'var(--color-kumo-default)' }}>{activeTab.toUpperCase()}</strong>
              {activeTab === 'pla' && ' — Polylactic acid. Easy to print, biodegradable.'}
              {activeTab === 'petg' && ' — Glycol-modified PET. Strong and food-safe.'}
              {activeTab === 'abs' && ' — Acrylonitrile butadiene styrene. Heat resistant.'}
              {activeTab === 'tpu' && ' — Thermoplastic polyurethane. Flexible.'}
              {activeTab === 'nylon' && ' — Polyamide. Engineering-grade, high strength.'}
            </div>
          </div>
          <div>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-kumo-subtle)', marginBottom: '0.625rem', fontWeight: 500 }}>
              UNDERLINE
            </p>
            <Tabs
              variant="underline"
              selectedValue="overview"
              tabs={[
                { value: 'overview', label: 'Overview' },
                { value: 'specs', label: 'Specifications' },
                { value: 'history', label: 'Print History' },
                { value: 'maintenance', label: 'Maintenance' },
              ]}
            />
          </div>
        </Section>

        {/* ── DROPDOWN ── */}
        <Section id="dropdown" title="Dropdown Menus">
          <div className="showcase-row">
            <DropdownMenu>
              <DropdownMenu.Trigger>
                <Button variant="secondary">Order Actions</Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Label>Order #1042</DropdownMenu.Label>
                <DropdownMenu.Separator />
                <DropdownMenu.Item icon={PencilSimple}>Edit Details</DropdownMenu.Item>
                <DropdownMenu.Item icon={CopySimple}>Duplicate Order</DropdownMenu.Item>
                <DropdownMenu.Item icon={Printer}>Assign Printer</DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item icon={ArrowUp}>Mark as Priority</DropdownMenu.Item>
                <DropdownMenu.Item icon={ArrowDown}>Defer to Next Week</DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item icon={TrashSimple} variant="danger">Delete Order</DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenu.Trigger>
                <Button variant="ghost" shape="square" icon={DotsThree} aria-label="More options" />
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item>View Report</DropdownMenu.Item>
                <DropdownMenu.Item>Export CSV</DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item variant="danger">Archive All</DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          </div>
        </Section>

        {/* ── DIALOG ── */}
        <Section id="dialog" title="Dialog / Modal">
          <div className="showcase-row">
            {/* Standard dialog */}
            <Dialog.Root>
              <Dialog.Trigger render={(p) => <Button variant="secondary" {...p}>Edit Order</Button>} />
              <Dialog className="p-8">
                <Dialog.Title style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Edit Order #1042
                </Dialog.Title>
                <Dialog.Description style={{ fontSize: '0.8125rem', color: 'var(--color-kumo-subtle)', marginBottom: '1.25rem' }}>
                  Update the details for this print order.
                </Dialog.Description>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <Input label="Customer" defaultValue="Acme Corp" />
                  <Select
                    label="Material"
                    items={[
                      { value: 'pla', label: 'PLA' },
                      { value: 'petg', label: 'PETG' },
                      { value: 'abs', label: 'ABS' },
                    ]}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <Dialog.Close render={(p) => <Button variant="ghost" {...p}>Cancel</Button>} />
                  <Dialog.Close render={(p) => <Button variant="primary" {...p}>Save Changes</Button>} />
                </div>
              </Dialog>
            </Dialog.Root>

            {/* Alert dialog */}
            <Dialog.Root role="alertdialog">
              <Dialog.Trigger render={(p) => <Button variant="destructive" {...p}>Delete Order</Button>} />
              <Dialog size="sm" className="p-8">
                <Dialog.Title style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Delete Order #1044?
                </Dialog.Title>
                <Dialog.Description style={{ fontSize: '0.8125rem', color: 'var(--color-kumo-subtle)', marginBottom: '1.5rem' }}>
                  This will permanently remove the order and all associated files. This action cannot be undone.
                </Dialog.Description>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <Dialog.Close render={(p) => <Button variant="secondary" {...p}>Cancel</Button>} />
                  <Dialog.Close render={(p) => <Button variant="destructive" {...p}>Delete</Button>} />
                </div>
              </Dialog>
            </Dialog.Root>
          </div>
        </Section>

        {/* ── ALERTS / BANNERS ── */}
        <Section id="alerts" title="Alerts">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Banner
              variant="default"
              title="Print queue updated"
              description="3 new orders have been added to Printer 01's queue. Estimated start: 14:30."
            />
            <Banner
              variant="default"
              title="Order #1043 completed"
              description="The PETG print job for Studio Zero finished successfully with 0 errors."
            />
            <Banner
              variant="alert"
              title="Low filament detected"
              icon={<Warning size={18} />}
              description="Printer 02 reports less than 200g of ABS remaining. Refill before starting the next job."
            />
            <Banner
              variant="error"
              title="Printer 03 offline"
              description="Communication lost with Printer 03. Check the USB/network connection and firmware status."
            />
          </div>
        </Section>

        {/* ── TOOLTIPS ── */}
        <Section id="tooltips" title="Tooltips">
          <div className="showcase-row">
            <Tooltip content="Start a new 3D print job">
              <Button variant="primary" icon={Printer}>New Print</Button>
            </Tooltip>
            <Tooltip content="Permanently delete this order. This action cannot be undone." side="top">
              <Button variant="destructive">Delete</Button>
            </Tooltip>
            <Tooltip content="Printer 02 is currently busy with order #1042" side="bottom">
              <Badge variant="warning" appearance="dot">Busy</Badge>
            </Tooltip>
            <Tooltip content="Copy order ID to clipboard" side="right">
              <Button variant="ghost" shape="square" icon={CopySimple} aria-label="Copy" />
            </Tooltip>
          </div>
        </Section>

        {/* ── BREADCRUMBS ── */}
        <Section id="breadcrumbs" title="Breadcrumbs">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Breadcrumbs>
              <Breadcrumbs.Link href="#">Rokishi OS</Breadcrumbs.Link>
              <Breadcrumbs.Separator />
              <Breadcrumbs.Link href="#">Orders</Breadcrumbs.Link>
              <Breadcrumbs.Separator />
              <Breadcrumbs.Current>#1042</Breadcrumbs.Current>
            </Breadcrumbs>
            <Breadcrumbs>
              <Breadcrumbs.Link href="#">Rokishi OS</Breadcrumbs.Link>
              <Breadcrumbs.Separator />
              <Breadcrumbs.Link href="#">Printers</Breadcrumbs.Link>
              <Breadcrumbs.Separator />
              <Breadcrumbs.Link href="#">Printer 01</Breadcrumbs.Link>
              <Breadcrumbs.Separator />
              <Breadcrumbs.Current>Maintenance Log</Breadcrumbs.Current>
            </Breadcrumbs>
          </div>
        </Section>

        {/* ── PAGINATION ── */}
        <Section id="pagination" title="Pagination">
          <Pagination page={page} setPage={setPage} perPage={perPage} totalCount={47}>
            <Pagination.Info />
            <Pagination.Separator />
            <Pagination.Controls />
          </Pagination>
        </Section>

        {/* ── PROGRESS / METER ── */}
        <Section id="progress" title="Progress / Meter">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '480px' }}>
            {[
              { label: 'Order #1042 — PLA', value: 68 },
              { label: 'Order #1043 — PETG', value: 100 },
              { label: 'Order #1044 — ABS', value: 0 },
              { label: 'Order #1045 — TPU (failed)', value: 22 },
            ].map((item) => (
              <div key={item.label}>
                <Meter
                  label={item.label}
                  value={item.value}
                />
              </div>
            ))}
            <div style={{ marginTop: '0.5rem' }}>
              <p style={{ fontSize: '0.6875rem', color: 'var(--color-kumo-subtle)', marginBottom: '0.5rem', fontWeight: 500 }}>
                CURRENT JOB
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <Meter label="Current print job progress" value={meterValue} />
                </div>
                <Badge variant="info">In Production</Badge>
              </div>
            </div>
          </div>
        </Section>

        {/* ── SKELETON ── */}
        <Section id="skeleton" title="Skeleton">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', maxWidth: '400px' }}>
            <div style={{ border: '1px solid var(--color-kumo-hairline)', borderRadius: '8px', padding: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-kumo-fill)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <div style={{ height: '12px', width: '60%', borderRadius: '4px', background: 'var(--color-kumo-fill)' }} />
                  <div style={{ height: '10px', width: '40%', borderRadius: '4px', background: 'var(--color-kumo-fill)' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <div style={{ height: '10px', width: '100%', borderRadius: '4px', background: 'var(--color-kumo-fill)' }} />
                <div style={{ height: '10px', width: '85%', borderRadius: '4px', background: 'var(--color-kumo-fill)' }} />
                <div style={{ height: '10px', width: '70%', borderRadius: '4px', background: 'var(--color-kumo-fill)' }} />
              </div>
            </div>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-kumo-subtle)' }}>
              Skeleton loading state for order cards
            </p>
          </div>
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        </Section>

        {/* ── AVATAR ── */}
        <Section id="avatar" title="Avatar">
          <div className="showcase-row" style={{ alignItems: 'center' }}>
            {[
              { initials: 'AC', label: 'Acme Corp', bg: '#3b82f6' },
              { initials: 'SZ', label: 'Studio Zero', bg: '#8b5cf6' },
              { initials: 'FL', label: 'Fab Lab MX', bg: '#10b981' },
              { initials: 'MK', label: 'Makespace', bg: '#f59e0b' },
            ].map((a) => (
              <Tooltip key={a.label} content={a.label}>
                <div
                  aria-label={a.label}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: a.bg,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: '#fff',
                    letterSpacing: '0.02em',
                    cursor: 'default',
                    border: '2px solid var(--color-kumo-canvas)',
                    outline: '1px solid var(--color-kumo-line)',
                  }}
                >
                  {a.initials}
                </div>
              </Tooltip>
            ))}
            <div style={{ display: 'flex', marginLeft: '0.25rem' }}>
              {[
                { initials: 'AC', bg: '#3b82f6' },
                { initials: 'SZ', bg: '#8b5cf6' },
                { initials: 'FL', bg: '#10b981' },
              ].map((a, i) => (
                <div
                  key={a.initials}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: a.bg,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '0.5625rem',
                    fontWeight: 700,
                    color: '#fff',
                    border: '2px solid var(--color-kumo-canvas)',
                    marginLeft: i > 0 ? '-8px' : '0',
                    position: 'relative',
                    zIndex: 3 - i,
                  }}
                >
                  {a.initials}
                </div>
              ))}
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--color-kumo-fill)',
                  border: '2px solid var(--color-kumo-canvas)',
                  marginLeft: '-8px',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '0.5625rem',
                  fontWeight: 600,
                  color: 'var(--color-kumo-subtle)',
                  position: 'relative',
                  zIndex: 0,
                }}
              >
                +4
              </div>
            </div>
          </div>
        </Section>

        {/* ── FORMS ── */}
        <Section id="forms" title="Forms">
          <div
            style={{
              border: '1px solid var(--color-kumo-hairline)',
              borderRadius: '8px',
              padding: '1.5rem',
              maxWidth: '520px',
            }}
          >
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: '0 0 0.25rem', color: 'var(--color-kumo-default)' }}>
              New Print Order
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-kumo-subtle)', margin: '0 0 1.25rem' }}>
              Configure a new 3D print job.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <Input label="Customer *" placeholder="Acme Corp" />
                <Input label="Order Reference" placeholder="#1046" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <Select
                  label="Material *"
                  items={[
                    { value: 'pla', label: 'PLA' },
                    { value: 'petg', label: 'PETG' },
                    { value: 'abs', label: 'ABS' },
                    { value: 'tpu', label: 'TPU' },
                  ]}
                  placeholder="Select..."
                />
                <Select
                  label="Assign Printer"
                  items={[
                    { value: 'auto', label: 'Auto-assign' },
                    { value: 'p01', label: 'Printer 01' },
                    { value: 'p02', label: 'Printer 02' },
                    { value: 'p03', label: 'Printer 03' },
                  ]}
                  placeholder="Select..."
                />
              </div>

              <div>
                <label htmlFor="form-notes" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.25rem', color: 'var(--color-kumo-default)' }}>
                  Notes
                </label>
                <Textarea id="form-notes" rows={3} placeholder="Special instructions, finishing requirements…" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Checkbox label="Rush order (+20% surcharge)" />
                <Checkbox checked label="Notify customer on completion" />
                <Switch id="form-supports" label="Generate support structures" />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.5rem',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid var(--color-kumo-hairline)',
                }}
              >
                <Button variant="ghost">Reset</Button>
                <Button variant="primary" icon={Printer}>Submit Order</Button>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </TooltipProvider>
  )
}
