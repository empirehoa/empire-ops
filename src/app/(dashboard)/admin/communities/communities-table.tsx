'use client'

import { useState } from 'react'
import type { CommunityRow } from '@/lib/types/database'
import { ui } from '../imports/_components/ui'

export type CommunityListRow = Pick<
  CommunityRow,
  'id' | 'vantaca_id' | 'name' | 'community_type' | 'portfolio' | 'manager_name' | 'doors' | 'status' | 'is_test'
>

export function CommunitiesTable({ initialRows }: { initialRows: CommunityListRow[] }) {
  const [rows, setRows] = useState(initialRows)
  const [query, setQuery] = useState('')
  const [testOnly, setTestOnly] = useState(false)
  const [pending, setPending] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const testCount = rows.filter((r) => r.is_test).length
  const q = query.trim().toLowerCase()
  const visible = rows.filter((r) => {
    if (testOnly && !r.is_test) return false
    if (!q) return true
    return [r.name, r.vantaca_id, r.portfolio, r.manager_name].some((v) => (v ?? '').toLowerCase().includes(q))
  })

  async function toggle(row: CommunityListRow) {
    const next = !row.is_test
    setError(null)
    setPending((p) => new Set(p).add(row.id))
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, is_test: next } : r)))
    let message: string | null = null
    try {
      const res = await fetch(`/api/imports/communities/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_test: next }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        message = typeof body?.error === 'string' ? body.error : `HTTP ${res.status}`
      }
    } catch {
      message = 'Could not reach the server'
    }
    if (message) {
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, is_test: row.is_test } : r)))
      setError(`Could not update ${row.name}: ${message}. The change was not saved.`)
    }
    setPending((p) => {
      const n = new Set(p)
      n.delete(row.id)
      return n
    })
  }

  return (
    <section aria-labelledby="communities-heading" className={ui.section}>
      <h2 id="communities-heading" className="sr-only">
        Community list
      </h2>
      <p className="text-sm text-foreground">
        <span className="tabular-nums">{rows.length.toLocaleString('en-US')}</span> communities,{' '}
        <span className="tabular-nums">{testCount.toLocaleString('en-US')}</span> marked as test. Test associations are
        excluded from all portfolio figures.
      </p>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="community-filter" className={ui.label}>
            Filter by name, Vantaca ID, portfolio, or manager
          </label>
          <input
            id="community-filter"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${ui.control} w-full sm:w-80`}
          />
        </div>
        <label className="flex h-9 items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={testOnly}
            onChange={(e) => setTestOnly(e.target.checked)}
            className="size-4 accent-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
          Show test associations only
        </label>
      </div>

      {error && (
        <p role="alert" className={`mt-3 ${ui.error}`}>
          {error}
        </p>
      )}

      <p className="sr-only" aria-live="polite">
        {visible.length} shown
      </p>

      <div className={`mt-3 ${ui.tableWrap}`}>
        <table className={ui.table}>
          <thead>
            <tr>
              <th scope="col" className={ui.th}>Name</th>
              <th scope="col" className={ui.th}>Vantaca ID</th>
              <th scope="col" className={ui.th}>Type</th>
              <th scope="col" className={ui.th}>Portfolio</th>
              <th scope="col" className={ui.th}>Manager</th>
              <th scope="col" className={`${ui.th} text-right`}>Doors</th>
              <th scope="col" className={ui.th}>Status</th>
              <th scope="col" className={ui.th}>Test association</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={8} className={`${ui.td} text-muted-foreground`}>
                  No communities match this filter.
                </td>
              </tr>
            ) : (
              visible.map((r) => (
                <tr key={r.id} className={r.is_test ? 'bg-muted/60' : undefined}>
                  <td className={`${ui.td} min-w-[14rem] font-medium`}>{r.name}</td>
                  <td className={`${ui.td} whitespace-nowrap text-muted-foreground`}>{r.vantaca_id}</td>
                  <td className={`${ui.td} whitespace-nowrap`}>{r.community_type ?? ''}</td>
                  <td className={`${ui.td} whitespace-nowrap`}>{r.portfolio ?? ''}</td>
                  <td className={`${ui.td} whitespace-nowrap`}>{r.manager_name ?? ''}</td>
                  <td className={`${ui.td} text-right tabular-nums`}>{r.doors == null ? '' : r.doors.toLocaleString('en-US')}</td>
                  <td className={`${ui.td} whitespace-nowrap`}>{r.status}</td>
                  <td className={ui.td}>
                    <TestSwitch
                      checked={r.is_test}
                      disabled={pending.has(r.id)}
                      label={`Test association: ${r.name}`}
                      onToggle={() => toggle(r)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function TestSwitch({
  checked,
  disabled,
  label,
  onToggle,
}: {
  checked: boolean
  disabled: boolean
  label: string
  onToggle: () => void
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={onToggle}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60 ${
          checked ? 'border-primary bg-primary' : 'border-border bg-muted'
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block size-3.5 rounded-full bg-card shadow-sm transition-transform ${
            checked ? 'translate-x-[1.125rem]' : 'translate-x-0.5'
          }`}
        />
      </button>
      <span className="text-xs text-muted-foreground" aria-hidden="true">
        {checked ? 'Test' : 'No'}
      </span>
    </span>
  )
}
