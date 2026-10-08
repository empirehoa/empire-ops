'use client'

import { useEffect } from 'react'

export default function ExecutiveError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex max-w-xl flex-col gap-3">
      <h1 className="font-[var(--font-poppins)] font-medium tracking-tight text-2xl text-foreground">
        This page could not load
      </h1>
      <p className="text-sm text-muted-foreground text-pretty">
        Reading from the database failed. Check that the Supabase environment variables are set and the schema migration has been applied.
        {error.digest ? ` Reference ${error.digest}.` : ''}
      </p>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.98]"
      >
        Try again
      </button>
    </div>
  )
}
