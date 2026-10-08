'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('sending')
    const res = await fetch('/api/auth/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => null)
    const body = await res?.json().catch(() => null)
    if (!res || !res.ok) {
      setState('error')
      setMessage(body?.error ?? 'Something went wrong. Check your connection and try again.')
      return
    }
    setState('sent')
    setMessage(body?.message ?? 'Check your email for a sign-in link.')
  }

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-5 bg-background">
      <div className="w-full max-w-sm">
        <h1 className="font-[var(--font-poppins)] font-medium tracking-tight text-2xl text-foreground">
          Empire Ops
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with your work email. We&apos;ll send you a one-time link.
        </p>
        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Work email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-[#21253A] px-3 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[#1C74AC]"
          />
          <button
            type="submit"
            disabled={state === 'sending'}
            className="h-11 rounded-lg bg-[#1C74AC] hover:bg-[#1C244B] text-white font-medium transition-colors duration-150 active:scale-[0.97] disabled:opacity-60"
          >
            {state === 'sending' ? 'Sending link…' : 'Send sign-in link'}
          </button>
          {message && (
            <p role="status" className={`text-sm ${state === 'error' ? 'text-[#C05A2E] dark:text-[#F98761]' : 'text-muted-foreground'}`}>
              {message}
            </p>
          )}
        </form>
      </div>
    </main>
  )
}
