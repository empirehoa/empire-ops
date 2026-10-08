'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/admin/executive', label: 'Executive', exact: true },
  { href: '/admin/executive/growth', label: 'Growth', exact: false },
  { href: '/admin/integrations', label: 'Integrations', exact: false },
  { href: '/admin/imports', label: 'Imports', exact: false },
  { href: '/admin/communities', label: 'Communities', exact: false },
]

export function AdminNav() {
  const pathname = usePathname() ?? ''
  return (
    <nav aria-label="Admin" className="-mx-1 flex items-center gap-1 overflow-x-auto">
      {LINKS.map((l) => {
        const active = l.exact ? pathname === l.href : pathname === l.href || pathname.startsWith(`${l.href}/`)
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors duration-150',
              active ? 'bg-accent text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            {l.label}
          </Link>
        )
      })}
    </nav>
  )
}
