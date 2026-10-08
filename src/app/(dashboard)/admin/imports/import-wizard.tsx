'use client'

import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { IMPORT_KINDS, KINDS, type ImportKind, type Mapping, type Suggestion } from '@/lib/integrations/vantaca/kinds'
import { makeRowValidator, mappedFields, mappingProblems, type RowValue } from '@/lib/integrations/vantaca/records'
import type { CommitResult, SkipReason } from '@/lib/integrations/vantaca/commit'
import { ui } from './_components/ui'

const MAX_BYTES = 15 * 1024 * 1024

type Preview = {
  kind: ImportKind
  filename: string
  format: 'xlsx' | 'csv'
  sheet_name: string | null
  header_row_number: number
  title_lines: string[]
  headers: string[]
  rows: string[][]
  row_numbers: number[]
  total_rows: number
  mapping: Mapping
  suggestions: Suggestion[]
  suggested_as_of: string | null
}

type Busy = null | 'preview' | 'check' | 'import'

async function postForm<T>(url: string, body: FormData): Promise<{ ok: true; data: T } | { ok: false; error: string; problems: string[] }> {
  let res: Response
  try {
    res = await fetch(url, { method: 'POST', body })
  } catch {
    return { ok: false, error: 'Could not reach the server. Check your connection and try again.', problems: [] }
  }
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const fallback =
      res.status === 413
        ? 'The server rejected the upload as too large.'
        : `The request failed (HTTP ${res.status}).`
    return {
      ok: false,
      error: typeof json?.error === 'string' ? json.error : fallback,
      problems: Array.isArray(json?.problems) ? json.problems : [],
    }
  }
  return { ok: true, data: json as T }
}

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`

function formatValue(value: RowValue, type: string) {
  if (value === null) return <span className="text-muted-foreground">blank</span>
  if (type === 'money' && typeof value === 'number') {
    const s = Math.abs(value).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
    return value < 0 ? `(${s})` : s
  }
  if (type === 'integer' && typeof value === 'number') return value.toLocaleString('en-US')
  return String(value)
}

export function ImportWizard() {
  const router = useRouter()
  const fileInput = useRef<HTMLInputElement>(null)
  const [kind, setKind] = useState<ImportKind>('communities')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [mapping, setMapping] = useState<Mapping>({})
  const [asOf, setAsOf] = useState('')
  const [busy, setBusy] = useState<Busy>(null)
  const [error, setError] = useState<{ message: string; problems: string[] } | null>(null)
  const [check, setCheck] = useState<CommitResult | null>(null)
  const [result, setResult] = useState<CommitResult | null>(null)

  const def = KINDS[preview?.kind ?? kind]
  const suggested = useMemo(() => new Map(preview?.suggestions.map((s) => [s.field, s.header]) ?? []), [preview])

  const problems = useMemo(
    () => (preview ? mappingProblems(preview.kind, mapping, preview.headers, { asOf: asOf || null }) : []),
    [preview, mapping, asOf],
  )

  const previewRows = useMemo(() => {
    if (!preview || problems.length > 0) return null
    const validate = makeRowValidator(preview.kind, mapping, preview.headers, { asOf: asOf || null })
    return preview.rows.map((row, i) => ({ rowNumber: preview.row_numbers[i], cells: row, outcome: validate(row) }))
  }, [preview, mapping, asOf, problems])

  const fieldsShown = preview ? mappedFields(preview.kind, mapping) : []
  const unusedHeaders = preview
    ? preview.headers.filter((h) => !Object.values(mapping).includes(h))
    : []

  function resetAfterUpload() {
    setPreview(null)
    setMapping({})
    setAsOf('')
    setCheck(null)
    setResult(null)
    setError(null)
  }

  function startOver() {
    resetAfterUpload()
    setFile(null)
    if (fileInput.current) fileInput.current.value = ''
  }

  function formFor(extra: Record<string, string>) {
    const fd = new FormData()
    fd.append('kind', preview?.kind ?? kind)
    fd.append('file', file as File)
    for (const [k, v] of Object.entries(extra)) fd.append(k, v)
    return fd
  }

  async function readFile(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      setError({ message: 'Choose a file first.', problems: [] })
      return
    }
    if (file.size > MAX_BYTES) {
      setError({ message: 'The file is larger than 15 MB. Export a smaller date range or fewer columns.', problems: [] })
      return
    }
    resetAfterUpload()
    setBusy('preview')
    const res = await postForm<Preview>('/api/imports/preview', formFor({}))
    setBusy(null)
    if (!res.ok) {
      setError({ message: res.error, problems: res.problems })
      return
    }
    setPreview(res.data)
    setMapping(res.data.mapping)
    setAsOf(res.data.suggested_as_of ?? '')
  }

  function changeMapping(field: string, header: string) {
    setMapping((m) => ({ ...m, [field]: header === '' ? null : header }))
    setCheck(null)
  }

  async function runCommit(dryRun: boolean) {
    if (!preview || !file) return
    setError(null)
    setBusy(dryRun ? 'check' : 'import')
    const res = await postForm<CommitResult>(
      '/api/imports/commit',
      formFor({ mapping: JSON.stringify(mapping), as_of: asOf, dry_run: dryRun ? 'true' : 'false' }),
    )
    setBusy(null)
    if (!res.ok) {
      setError({ message: res.error, problems: res.problems })
      if (!dryRun) router.refresh()
      return
    }
    if (dryRun) setCheck(res.data)
    else {
      setResult(res.data)
      router.refresh()
    }
  }

  const statusText =
    busy === 'preview'
      ? 'Reading file…'
      : busy === 'check'
        ? 'Checking every row…'
        : busy === 'import'
          ? 'Importing…'
          : ''

  return (
    <div className="flex flex-col gap-4">
      <p className="sr-only" role="status" aria-live="polite">
        {statusText}
      </p>

      {/* Step 1: kind and file */}
      <section aria-labelledby="step-file" className={ui.section}>
        <h2 id="step-file" className={ui.h2}>
          1. Choose the export
        </h2>
        <form onSubmit={readFile} className="mt-3 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="import-kind" className={ui.label}>
              What this file contains
            </label>
            <select
              id="import-kind"
              className={`${ui.control} min-w-[12rem]`}
              value={kind}
              disabled={busy !== null || result !== null}
              onChange={(e) => {
                setKind(e.target.value as ImportKind)
                resetAfterUpload()
              }}
            >
              {IMPORT_KINDS.map((k) => (
                <option key={k} value={k}>
                  {KINDS[k].label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <label htmlFor="import-file" className={ui.label}>
              Export file
            </label>
            <input
              ref={fileInput}
              id="import-file"
              type="file"
              accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              aria-describedby="import-file-hint"
              disabled={busy !== null || result !== null}
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null)
                resetAfterUpload()
              }}
              className="block w-full max-w-md text-sm text-foreground file:mr-3 file:h-9 file:cursor-pointer file:rounded-md file:border file:border-border file:bg-secondary file:px-3 file:text-sm file:font-medium file:text-secondary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
          </div>
          <button type="submit" className={ui.primaryButton} disabled={!file || busy !== null || result !== null}>
            {busy === 'preview' ? 'Reading…' : 'Read file'}
          </button>
        </form>
        <p id="import-file-hint" className={`mt-2 ${ui.hint}`}>
          {KINDS[kind].description} Use Export to Excel in Vantaca. .xlsx or .csv, up to 15 MB.
        </p>
      </section>

      {error && (
        <div role="alert" className={`${ui.section} flex flex-col gap-1`}>
          <p className={ui.error}>{error.message}</p>
          {error.problems.length > 0 && (
            <ul className="list-disc pl-5 text-sm text-attention">
              {error.problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Step 2: mapping */}
      {preview && !result && (
        <section aria-labelledby="step-map" className={ui.section}>
          <h2 id="step-map" className={ui.h2}>
            2. Match columns
          </h2>
          <p className={`mt-1 ${ui.hint}`}>
            {preview.filename}
            {preview.sheet_name ? `, sheet "${preview.sheet_name}"` : ''}: headers on row {preview.header_row_number},{' '}
            {plural(preview.total_rows, 'data row')}. Suggested columns are only a starting point; check each one.
          </p>
          {preview.title_lines.length > 0 && (
            <p className={`mt-1 ${ui.hint}`}>Report title rows: {preview.title_lines.join(' / ')}</p>
          )}

          <div className={`mt-3 ${ui.tableWrap}`}>
            <table className={ui.table}>
              <thead>
                <tr>
                  <th scope="col" className={ui.th}>Field</th>
                  <th scope="col" className={ui.th}>Column in your file</th>
                  <th scope="col" className={ui.th}>First values in that column</th>
                </tr>
              </thead>
              <tbody>
                {def.fields.map((f) => {
                  const header = mapping[f.key] ?? ''
                  const col = header ? preview.headers.indexOf(header) : -1
                  const samples =
                    col >= 0
                      ? preview.rows
                          .map((r) => r[col])
                          .filter((v) => v !== '')
                          .slice(0, 3)
                      : []
                  const selectId = `map-${f.key}`
                  const isSuggested = header !== '' && suggested.get(f.key) === header
                  return (
                    <tr key={f.key}>
                      <td className={`${ui.td} min-w-[12rem]`}>
                        <label htmlFor={selectId} className="font-medium">
                          {f.label}
                        </label>
                        {f.required && <span className="ml-1.5 text-xs text-muted-foreground">(required)</span>}
                        {f.help && <p className="mt-0.5 text-xs text-muted-foreground">{f.help}</p>}
                      </td>
                      <td className={`${ui.td} whitespace-nowrap`}>
                        <select
                          id={selectId}
                          className={`${ui.control} w-56 max-w-full`}
                          value={header}
                          disabled={busy !== null}
                          onChange={(e) => changeMapping(f.key, e.target.value)}
                        >
                          <option value="">Not in this file</option>
                          {preview.headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                        {isSuggested && <span className="ml-2 text-xs text-muted-foreground">suggested</span>}
                      </td>
                      <td className={`${ui.td} max-w-[22rem] truncate text-muted-foreground`}>
                        {samples.length > 0 ? samples.join(', ') : col >= 0 ? 'blank in the first rows' : ''}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {unusedHeaders.length > 0 && (
            <p className={`mt-2 ${ui.hint}`}>Columns not used: {unusedHeaders.join(', ')}</p>
          )}

          {preview.kind === 'ar_aging' && (
            <div className="mt-4 flex flex-col gap-1.5">
              <label htmlFor="as-of" className={ui.label}>
                As-of date for the whole file
              </label>
              <input
                id="as-of"
                type="date"
                className={`${ui.control} w-48`}
                value={asOf}
                disabled={busy !== null}
                aria-describedby="as-of-hint"
                onChange={(e) => {
                  setAsOf(e.target.value)
                  setCheck(null)
                }}
              />
              <p id="as-of-hint" className="text-xs text-muted-foreground">
                {preview.suggested_as_of && asOf === preview.suggested_as_of
                  ? 'Taken from the report title. Confirm it matches the export.'
                  : 'Used for every row, or for rows where the mapped as-of column is blank.'}
              </p>
            </div>
          )}

          {problems.length > 0 && (
            <ul className="mt-4 list-disc pl-5 text-sm text-attention" aria-label="Mapping problems">
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}

          {previewRows && (
            <>
              <h3 className="mt-5 text-sm font-medium text-foreground">First {previewRows.length} rows as they will be imported</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Association matching is checked in the next step, against all communities.
              </p>
              <div className={`mt-2 ${ui.tableWrap}`}>
                <table className={ui.table}>
                  <thead>
                    <tr>
                      <th scope="col" className={`${ui.th} text-right`}>Row</th>
                      {fieldsShown.map((f) => (
                        <th
                          key={f.key}
                          scope="col"
                          className={`${ui.th} ${f.type === 'money' || f.type === 'integer' ? 'text-right' : ''}`}
                        >
                          {f.label}
                        </th>
                      ))}
                      {preview.kind === 'ar_aging' && !mapping.total && (
                        <th scope="col" className={`${ui.th} text-right`}>Total (sum)</th>
                      )}
                      <th scope="col" className={ui.th}>Problem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map(({ rowNumber, cells, outcome }) => (
                      <tr key={rowNumber}>
                        <td className={`${ui.td} text-right tabular-nums text-muted-foreground`}>{rowNumber}</td>
                        {fieldsShown.map((f) => {
                          const numeric = f.type === 'money' || f.type === 'integer'
                          let content: React.ReactNode
                          if (outcome.ok) content = formatValue(outcome.values[f.key] ?? null, f.type)
                          else {
                            const raw = cells[preview.headers.indexOf(mapping[f.key] as string)]
                            content = raw || <span className="text-muted-foreground">blank</span>
                          }
                          return (
                            <td key={f.key} className={`${ui.td} whitespace-nowrap ${numeric ? 'text-right tabular-nums' : ''}`}>
                              {content}
                            </td>
                          )
                        })}
                        {preview.kind === 'ar_aging' && !mapping.total && (
                          <td className={`${ui.td} whitespace-nowrap text-right tabular-nums`}>
                            {outcome.ok ? formatValue(outcome.values.total ?? null, 'money') : ''}
                          </td>
                        )}
                        <td className={`${ui.td} min-w-[14rem] ${outcome.ok ? 'text-muted-foreground' : 'text-attention'}`}>
                          {outcome.ok ? '' : outcome.reasons.join('; ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className={ui.primaryButton}
              disabled={problems.length > 0 || busy !== null}
              onClick={() => runCommit(true)}
            >
              {busy === 'check' ? 'Checking…' : 'Check all rows'}
            </button>
            <button type="button" className={ui.secondaryButton} disabled={busy !== null} onClick={startOver}>
              Start over
            </button>
          </div>
        </section>
      )}

      {/* Step 3: confirm */}
      {preview && check && !result && (
        <section aria-labelledby="step-confirm" className={ui.section}>
          <h2 id="step-confirm" className={ui.h2}>
            3. Confirm import
          </h2>
          <p className="mt-1 text-sm text-foreground">
            {plural(check.rows_total, 'row')} in the file: <span className="tabular-nums">{check.rows_imported.toLocaleString('en-US')}</span>{' '}
            ready to import, <span className="tabular-nums">{check.rows_skipped.toLocaleString('en-US')}</span> will be skipped.
            Nothing has been written yet.
          </p>
          <Warnings warnings={check.warnings} />
          <SkippedTable reasons={check.skipped_reasons} total={check.rows_skipped} />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className={ui.primaryButton}
              disabled={check.rows_imported === 0 || busy !== null}
              onClick={() => runCommit(false)}
            >
              {busy === 'import' ? 'Importing…' : `Import ${plural(check.rows_imported, 'row')}`}
            </button>
            <span className={ui.hint}>Change a column above to check again.</span>
          </div>
        </section>
      )}

      {/* Result */}
      {result && (
        <section aria-labelledby="step-result" className={ui.section}>
          <h2 id="step-result" className={ui.h2}>
            Import finished
          </h2>
          <p className="mt-1 text-sm text-foreground">
            {result.filename}: imported <span className="tabular-nums">{result.rows_imported.toLocaleString('en-US')}</span> of{' '}
            {plural(result.rows_total, 'row')}, skipped <span className="tabular-nums">{result.rows_skipped.toLocaleString('en-US')}</span>.
          </p>
          {result.rows_imported === 0 && (
            <p className={`mt-1 ${ui.error}`}>No rows were imported, so this run is recorded as failed.</p>
          )}
          <Warnings warnings={result.warnings} />
          <SkippedTable reasons={result.skipped_reasons} total={result.rows_skipped} />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" className={ui.primaryButton} onClick={startOver}>
              Import another file
            </button>
            {result.rows_imported > 0 && (preview?.kind ?? kind) === 'communities' && (
              <Link href="/admin/communities" className={`text-sm ${ui.link}`}>
                Review communities and mark test associations
              </Link>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

function Warnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null
  return (
    <ul className="mt-2 list-disc pl-5 text-sm text-attention">
      {warnings.map((w) => (
        <li key={w}>{w}</li>
      ))}
    </ul>
  )
}

function SkippedTable({ reasons, total }: { reasons: SkipReason[]; total: number }) {
  if (reasons.length === 0) return null
  return (
    <div className="mt-3">
      <h3 className="text-sm font-medium text-foreground">
        Skipped rows{total > reasons.length ? ` (first ${reasons.length} of ${total.toLocaleString('en-US')})` : ''}
      </h3>
      <div className={`mt-2 max-h-80 overflow-y-auto ${ui.tableWrap}`}>
        <table className={ui.table}>
          <thead className="sticky top-0">
            <tr>
              <th scope="col" className={`${ui.th} w-20 text-right`}>Row</th>
              <th scope="col" className={ui.th}>Reason</th>
            </tr>
          </thead>
          <tbody>
            {reasons.map((r, i) => (
              <tr key={`${r.row}-${i}`}>
                <td className={`${ui.td} text-right tabular-nums text-muted-foreground`}>{r.row}</td>
                <td className={`${ui.td} min-w-[20rem]`}>{r.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
