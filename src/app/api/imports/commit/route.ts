import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdminApi } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { commitImport, ImportWriteError, MappingError } from '@/lib/integrations/vantaca/commit'
import { ImportFileError, parseImportFile } from '@/lib/integrations/vantaca/parse'
import { readImportUpload } from '@/lib/integrations/vantaca/upload'

export const runtime = 'nodejs'
export const maxDuration = 60

const mappingSchema = z.record(z.string(), z.string().nullable())
const asOfSchema = z.string().trim().max(40)

/**
 * POST multipart { file, kind, mapping (JSON), as_of?, dry_run? }.
 * Validates every row, matches associations, upserts, and records a sync run.
 * With dry_run=true it reports what would happen without writing anything.
 */
export async function POST(request: Request) {
  const admin = await requireAdminApi()
  if (admin instanceof NextResponse) return admin

  const upload = await readImportUpload(request)
  if (!upload.ok) return NextResponse.json({ error: upload.error }, { status: upload.status })

  let mapping: z.infer<typeof mappingSchema>
  try {
    mapping = mappingSchema.parse(JSON.parse(String(upload.form.get('mapping') ?? '')))
  } catch {
    return NextResponse.json({ error: 'The column mapping is missing or malformed.' }, { status: 400 })
  }
  const asOfRaw = upload.form.get('as_of')
  const asOfParsed = asOfSchema.safeParse(typeof asOfRaw === 'string' ? asOfRaw : '')
  if (!asOfParsed.success) return NextResponse.json({ error: 'The as-of date is malformed.' }, { status: 400 })
  const asOf = asOfParsed.data || null
  const dryRun = upload.form.get('dry_run') === 'true'

  try {
    const table = await parseImportFile(upload.buffer, upload.file.name)
    const result = await commitImport(createAdminClient(), {
      kind: upload.kind,
      table,
      mapping,
      asOf,
      filename: upload.file.name,
      dryRun,
    })
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof ImportFileError) return NextResponse.json({ error: err.message }, { status: 422 })
    if (err instanceof MappingError) {
      return NextResponse.json({ error: 'Fix the column mapping first.', problems: err.problems }, { status: 400 })
    }
    if (err instanceof ImportWriteError) return NextResponse.json({ error: err.message }, { status: 500 })
    console.error('[imports/commit]', err)
    return NextResponse.json({ error: 'The import failed. Nothing further was written.' }, { status: 500 })
  }
}
