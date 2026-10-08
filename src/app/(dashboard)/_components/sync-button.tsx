'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

/** POSTs to an admin endpoint, shows the outcome, then refreshes the page data. */
export function SyncButton({
  endpoint,
  label,
  disabled,
  disabledReason,
}: {
  endpoint: string
  label: string
  disabled?: boolean
  disabledReason?: string
}) {
  const router = useRouter()
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [, startTransition] = useTransition()

  async function run() {
    setRunning(true)
    setMessage(null)
    try {
      const res = await fetch(endpoint, { method: 'POST' })
      const body = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) {
        setMessage({ tone: 'error', text: body?.error ?? `Failed with HTTP ${res.status}.` })
      } else {
        setMessage({ tone: 'ok', text: 'Finished.' })
        startTransition(() => router.refresh())
      }
    } catch {
      setMessage({ tone: 'error', text: 'Could not reach the server. Check your connection and try again.' })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={run}
        disabled={disabled || running}
        className="rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {running ? 'Running...' : label}
      </button>
      {disabled && disabledReason && <p className="text-xs text-muted-foreground">{disabledReason}</p>}
      {message && (
        <p role="status" className={cn('text-xs', message.tone === 'error' ? 'text-attention' : 'text-muted-foreground')}>
          {message.text}
        </p>
      )}
    </div>
  )
}
