import Link from 'next/link'

/** Shared class strings for the Vantaca import and communities pages. */
export const ui = {
  page: 'mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8',
  title: 'font-[var(--font-poppins)] font-medium tracking-tight text-2xl text-foreground',
  section: 'rounded-lg border border-border bg-card p-4 sm:p-5',
  h2: 'text-base font-medium text-foreground',
  label: 'text-sm font-medium text-foreground',
  hint: 'text-sm text-muted-foreground',
  control:
    'h-9 rounded-md border border-border bg-card px-2.5 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60',
  primaryButton:
    'inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50',
  secondaryButton:
    'inline-flex h-9 items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50',
  link: 'text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-sm',
  tableWrap: 'overflow-x-auto rounded-md border border-border',
  table: 'w-full border-collapse text-sm',
  th: 'whitespace-nowrap border-b border-border bg-muted px-3 py-2 text-left font-medium text-muted-foreground',
  td: 'border-b border-border px-3 py-2 align-top text-foreground',
  error: 'text-sm text-attention',
}

export function AdminSubnav({ current }: { current: 'imports' | 'communities' }) {
  const item = (href: string, key: typeof current, label: string) => (
    <Link
      href={href}
      aria-current={current === key ? 'page' : undefined}
      className={`rounded-md px-2.5 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
        current === key ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </Link>
  )
  return (
    <nav aria-label="Vantaca data" className="flex flex-wrap gap-1">
      {item('/admin/imports', 'imports', 'Imports')}
      {item('/admin/communities', 'communities', 'Communities')}
    </nav>
  )
}

/** Date and time in Eastern time (EMG headquarters). */
export function formatRunTime(iso: string | null): string {
  if (!iso) return ''
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}
