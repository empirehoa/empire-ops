import { isImportKind, type ImportKind } from './kinds'
import { MAX_UPLOAD_BYTES } from './parse'

export type UploadOk = { ok: true; form: FormData; file: File; buffer: ArrayBuffer; kind: ImportKind }
export type UploadError = { ok: false; status: number; error: string }

const TOO_LARGE = 'The file is larger than 15 MB. Export a smaller date range or fewer columns.'
// Multipart framing and the other form fields add a little on top of the file.
const FORM_OVERHEAD_BYTES = 256 * 1024

/** Reads a multipart upload with `file` and `kind`, enforcing the 15 MB limit. */
export async function readImportUpload(request: Request): Promise<UploadOk | UploadError> {
  const length = Number(request.headers.get('content-length') ?? '')
  if (Number.isFinite(length) && length > MAX_UPLOAD_BYTES + FORM_OVERHEAD_BYTES) {
    return { ok: false, status: 413, error: TOO_LARGE }
  }
  if (!(request.headers.get('content-type') ?? '').toLowerCase().includes('multipart/form-data')) {
    return { ok: false, status: 400, error: 'Send the file as multipart/form-data.' }
  }
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return { ok: false, status: 400, error: 'Could not read the upload. Try again.' }
  }
  const kind = form.get('kind')
  if (!isImportKind(kind)) {
    return { ok: false, status: 400, error: 'Choose what the file contains: communities, AR aging, or action items.' }
  }
  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, status: 400, error: 'Choose a non-empty .xlsx or .csv file.' }
  }
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, status: 413, error: TOO_LARGE }
  return { ok: true, form, file, buffer: await file.arrayBuffer(), kind }
}
