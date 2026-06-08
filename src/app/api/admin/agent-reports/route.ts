/**
 * GET /api/admin/agent-reports?agent=sales-intelligence
 *
 * Returns the content of a specific agent's latest markdown report,
 * along with metadata (file path, last modified, size).
 *
 * Query params:
 *   agent (required) — Agent name matching the report filename pattern
 *                      e.g. "sales-intelligence" reads "sales-intelligence-latest.md"
 *
 * Requires admin read permission (super_admin or tenant_admin).
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkRoutePermission } from '@/lib/auth/rbac'
import { readFile, stat } from 'fs/promises'
import { join } from 'path'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPORTS_DIR = join(process.cwd(), 'docs', 'agent-reports')

// Allowed agent name pattern — alphanumeric plus hyphens, no path traversal
const AGENT_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  // ---- Auth ---------------------------------------------------------------
  const auth = await checkRoutePermission('admin', 'read')
  if (auth instanceof NextResponse) return auth

  // ---- Parse query params -------------------------------------------------
  const { searchParams } = new URL(request.url)
  const agentName = searchParams.get('agent')

  if (!agentName) {
    return NextResponse.json(
      {
        error: 'Missing required query parameter: agent',
        example: '/api/admin/agent-reports?agent=sales-intelligence',
      },
      { status: 400 }
    )
  }

  // Validate agent name to prevent path traversal
  if (!AGENT_NAME_PATTERN.test(agentName)) {
    return NextResponse.json(
      {
        error: 'Invalid agent name. Must be lowercase alphanumeric with hyphens.',
        provided: agentName,
      },
      { status: 400 }
    )
  }

  // ---- Read report file ---------------------------------------------------
  const filename = `${agentName}-latest.md`
  const filePath = join(REPORTS_DIR, filename)

  try {
    const [content, fileStats] = await Promise.all([
      readFile(filePath, 'utf-8'),
      stat(filePath),
    ])

    // Parse date from header if present
    const dateMatch = content.match(/\*?\*?Run date\*?\*?:\s*(\d{4}-\d{2}-\d{2})/)
    const runDate = dateMatch ? dateMatch[1] : null

    // Parse status from header if present
    const statusMatch = content.match(/\*?\*?(?:Build )?[Ss]tatus\*?\*?:\s*(\w+)/)
    const buildStatus = statusMatch ? statusMatch[1].toUpperCase() : null

    // Parse agent name from header if present
    const agentMatch = content.match(/\*?\*?Agent\*?\*?:\s*(.+?)(?:\s*\n|\s*\*\*)/)
    const agentLabel = agentMatch ? agentMatch[1].trim() : agentName

    return NextResponse.json({
      agent: agentName,
      agentLabel,
      file: `docs/agent-reports/${filename}`,
      runDate,
      buildStatus,
      lastModified: fileStats.mtime.toISOString(),
      sizeBytes: fileStats.size,
      content,
    })
  } catch (err) {
    const isNotFound =
      err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT'

    if (isNotFound) {
      return NextResponse.json(
        {
          error: 'Report not found',
          agent: agentName,
          expectedFile: `docs/agent-reports/${filename}`,
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to read report file',
        agent: agentName,
      },
      { status: 500 }
    )
  }
}
