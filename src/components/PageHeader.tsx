import type { ReactNode } from 'react'
import { Breadcrumbs } from '@cloudflare/kumo/components/breadcrumbs'

type PageHeaderProps = {
  title: string
  description: string
  action: ReactNode
}

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <Breadcrumbs>
          <Breadcrumbs.Link href="/">Rokishi OS</Breadcrumbs.Link>
          <Breadcrumbs.Separator />
          <Breadcrumbs.Current>{title}</Breadcrumbs.Current>
        </Breadcrumbs>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="page-header-action">{action}</div>
    </header>
  )
}
