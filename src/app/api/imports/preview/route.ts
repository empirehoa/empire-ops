import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin'
import { suggestMapping } from '@/lib/integrations/vantaca/kinds'
import { findDateInTitle, ImportFileError, parseImportFile } from '@/lib/integrations/vantaca/parse'
import { readImportUpload } from '@/lib/integrations/vantaca/upload'

export const runtime = 'nodejs'

const PREVIEW_ROWS = 10

/**
 * POST multipart { file, kind } → the file's real headers, the first rows, and
 * a suggested column mapping for the admin to confirm. Nothing is stored.
 */
export async function POST(request: Request) {
  const admin = await requireAdminApi()
  if (admin instanceof NextResponse) return admin

  const upload = await readImportUpload(request)
  if (!upload.ok) return NextResponse.json({ error: upload.error }, { status: upload.status })

  try {
    const table = await parseImportFile(upload.buffer, upload.file.name)
    const { mapping, suggestions } = suggestMapping(upload.kind, table.headers)
    return NextResponse.json({
      kind: upload.kind,
      filename: upload.file.name,
      format: table.format,
      sheet_name: table.sheetName,
      header_row_number: table.headerRowNumber,
      title_lines: table.titleLines.slice(0, 5).map((l) => l.slice(0, 200)),
      headers: table.headers,
      rows: table.rows.slice(0, PREVIEW_ROWS),
      row_numbers: table.rowNumbers.slice(0, PREVIEW_ROWS),
      total_rows: table.rows.length,
      mapping,
      suggestions,
      suggested_as_of: upload.kind === 'ar_aging' ? findDateInTitle(table.titleLines) : null,
    })
  } catch (err) {
    if (err instanceof ImportFileError) return NextResponse.json({ error: err.message }, { status: 422 })
    console.error('[imports/preview]', err)
    return NextResponse.json({ error: 'Could not read the file.' }, { status: 500 })
  }
}
