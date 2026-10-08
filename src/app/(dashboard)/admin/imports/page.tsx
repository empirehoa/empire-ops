import type { Metadata } from 'next'
import { requireAdminPage } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { KINDS, isImportKind } from '@/lib/integrations/vantaca/kinds'
import { AdminSubnav, formatRunTime, ui } from './_components/ui'
import { ImportWizard } from './import-wizard'

export const metadata: Metadata = { title: 'Vantaca imports | Empire Ops' }

type RunDetail = { filename?: unknown; rows_total?: unknown; rows_imported?: unknown; rows_skipped?: unknown }

export default async function ImportsPage() {
  await requireAdminPage()
  const db = createAdminClient()
  const { data: runs, error } = await db
    .from('sync_runs')
    .select('id, source, started_at, status, rows_written, detail, error')
    .like('source', 'vantaca:%')
    .order('started_at', { ascending: false })
    .limit(20)

  return (
    <main className={ui.page}>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <AdminSubnav current="imports" />
          <div>
            <h1 className={ui.title}>Vantaca imports</h1>
            <p className={`mt-1 ${ui.hint}`}>
              Upload an export from Vantaca CMP or Vantaca IQ, match its columns to Empire Ops fields, check every row,
              then import.
            </p>
          </div>
        </header>

        <ImportWizard />

        <section aria-labelledby="recent-imports" className={ui.section}>
          <h2 id="recent-imports" className={ui.h2}>
            Recent Vantaca imports
          </h2>
          {error ? (
            <p className={`mt-3 ${ui.error}`} role="alert">
              Could not load recent imports: {error.message}
            </p>
          ) : !runs || runs.length === 0 ? (
            <p className={`mt-3 ${ui.hint}`}>No Vantaca imports yet.</p>
          ) : (
            <div className={`mt-3 ${ui.tableWrap}`}>
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th scope="col" className={ui.th}>Started</th>
                    <th scope="col" className={ui.th}>Kind</th>
                    <th scope="col" className={ui.th}>File</th>
                    <th scope="col" className={ui.th}>Status</th>
                    <th scope="col" className={`${ui.th} text-right`}>Imported</th>
                    <th scope="col" className={`${ui.th} text-right`}>Skipped</th>
                    <th scope="col" className={ui.th}>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => {
                    const kind = run.source.replace(/^vantaca:/, '')
                    const detail = (run.detail ?? {}) as RunDetail
                    const skipped = typeof detail.rows_skipped === 'number' ? detail.rows_skipped : null
                    return (
                      <tr key={run.id}>
                        <td className={`${ui.td} whitespace-nowrap tabular-nums`}>{formatRunTime(run.started_at)}</td>
                        <td className={`${ui.td} whitespace-nowrap`}>{isImportKind(kind) ? KINDS[kind].label : kind}</td>
                        <td className={`${ui.td} max-w-[16rem] truncate`}>
                          {typeof detail.filename === 'string' ? detail.filename : ''}
                        </td>
                        <td className={`${ui.td} whitespace-nowrap`}>
                          <span className={run.status === 'failed' ? 'text-attention' : undefined}>
                            {run.status === 'succeeded' ? 'Succeeded' : run.status === 'failed' ? 'Failed' : 'Running'}
                          </span>
                        </td>
                        <td className={`${ui.td} text-right tabular-nums`}>{run.rows_written.toLocaleString('en-US')}</td>
                        <td className={`${ui.td} text-right tabular-nums`}>
                          {skipped === null ? '' : skipped.toLocaleString('en-US')}
                        </td>
                        <td className={`${ui.td} min-w-[16rem] text-muted-foreground`}>{run.error ?? ''}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
