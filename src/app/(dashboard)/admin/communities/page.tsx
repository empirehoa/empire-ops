import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdminPage } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminSubnav, formatRunTime, ui } from '../imports/_components/ui'
import { CommunitiesTable, type CommunityListRow } from './communities-table'

export const metadata: Metadata = { title: 'Communities | Empire Ops' }

const PAGE = 1000

async function loadCommunities(db: ReturnType<typeof createAdminClient>) {
  const rows: CommunityListRow[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from('communities')
      .select('id, vantaca_id, name, community_type, portfolio, manager_name, doors, status, is_test')
      .order('name')
      .order('id')
      .range(from, from + PAGE - 1)
    if (error) return { rows, error: error.message }
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE) return { rows, error: null }
  }
}

export default async function CommunitiesPage() {
  await requireAdminPage()
  const db = createAdminClient()
  const [{ rows, error }, lastImport] = await Promise.all([
    loadCommunities(db),
    db
      .from('sync_runs')
      .select('finished_at')
      .eq('source', 'vantaca:communities')
      .eq('status', 'succeeded')
      .order('finished_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])
  const lastImportAt = lastImport.data?.finished_at ?? null

  return (
    <main className={ui.page}>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <AdminSubnav current="communities" />
          <div>
            <h1 className={ui.title}>Communities</h1>
            <p className={`mt-1 ${ui.hint}`}>
              Associations imported from Vantaca.{' '}
              {lastImportAt ? `Last communities import ${formatRunTime(lastImportAt)}.` : 'No communities import has succeeded yet.'}
            </p>
          </div>
        </header>

        {error ? (
          <p role="alert" className={`${ui.section} ${ui.error}`}>
            Could not load communities: {error}
          </p>
        ) : rows.length === 0 ? (
          <section className={ui.section}>
            <p className="text-sm text-foreground">No communities yet.</p>
            <p className={`mt-1 ${ui.hint}`}>
              Import a communities export on the{' '}
              <Link href="/admin/imports" className={ui.link}>
                Imports
              </Link>{' '}
              page, then mark any test associations here.
            </p>
          </section>
        ) : (
          <CommunitiesTable initialRows={rows} />
        )}
      </div>
    </main>
  )
}
