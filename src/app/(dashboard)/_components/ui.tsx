// Small presentational pieces shared by the admin pages. Server-safe (no hooks).
// Tokens come from src/app/globals.css. Poppins is reserved for page titles.

import Link from 'next/link'
import { cn } from '@/lib/utils'

export function PageTitle({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-[var(--font-poppins)] font-medium tracking-tight text-2xl sm:text-3xl text-foreground text-balance">
        {title}
      </h1>
      {children}
    </div>
  )
}

export function Section({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('flex flex-col gap-4', className)} aria-label={title}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="flex flex-col gap-1 max-w-3xl">
          <h2 className="text-lg font-medium text-foreground">{title}</h2>
          {description && <p className="text-sm text-muted-foreground text-pretty">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

/** A bordered surface for one real unit (a company, a data source). */
export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-xl border border-border bg-card p-5', className)}>{children}</div>
}

export function Stat({
  label,
  value,
  detail,
  size = 'md',
  tone = 'default',
}: {
  label: string
  value: React.ReactNode
  detail?: React.ReactNode
  size?: 'lg' | 'md'
  tone?: 'default' | 'attention'
}) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          'tabular-nums font-medium leading-none',
          size === 'lg' ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl',
          tone === 'attention' ? 'text-attention' : 'text-foreground',
        )}
      >
        {value}
      </span>
      {detail && <span className="text-sm text-muted-foreground tabular-nums">{detail}</span>}
    </div>
  )
}

export function EmptyState({ children, href, linkLabel }: { children: React.ReactNode; href?: string; linkLabel?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-5 py-6 text-sm text-muted-foreground">
      <p className="text-pretty">{children}</p>
      {href && linkLabel && (
        <Link
          href={href}
          className="mt-3 inline-flex items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  )
}

export function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground text-pretty max-w-3xl">{children}</p>
}

/** Horizontal bar whose width is value / max, drawn to scale from zero. */
export function ScaleBar({
  value,
  max,
  tone = 'neutral',
  label,
}: {
  value: number
  max: number
  tone?: 'neutral' | 'attention'
  label: string
}) {
  const width = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  return (
    <div className="h-2 w-full rounded-full bg-muted" role="img" aria-label={label}>
      <div
        className={cn('h-2 rounded-full', tone === 'attention' ? 'bg-attention' : 'bg-foreground/70')}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}

export function DataTable({
  head,
  rows,
  align,
  caption,
}: {
  head: string[]
  rows: React.ReactNode[][]
  /** 'right' for numeric columns. */
  align?: Array<'left' | 'right'>
  caption?: string
}) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-border">
            {head.map((h, i) => (
              <th
                key={i}
                scope="col"
                className={cn(
                  'px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap',
                  align?.[i] === 'right' ? 'text-right' : 'text-left',
                )}
              >
                {h || <span className="sr-only">Chart</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="border-b border-border last:border-0">
              {row.map((cell, i) => (
                <td
                  key={i}
                  className={cn('px-4 py-2.5 align-top', align?.[i] === 'right' ? 'text-right tabular-nums whitespace-nowrap' : 'text-left')}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function RunStatus({ status }: { status: string | null | undefined }) {
  const s = status ?? 'never_run'
  const label: Record<string, string> = {
    succeeded: 'Succeeded',
    skipped: 'Skipped',
    failed: 'Failed',
    running: 'Running',
    never_run: 'Never run',
  }
  return (
    <span className={cn('text-sm whitespace-nowrap', s === 'failed' ? 'text-attention font-medium' : 'text-muted-foreground')}>
      {label[s] ?? s}
    </span>
  )
}
