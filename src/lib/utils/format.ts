/**
 * Format a number as currency in accounting style.
 * Positive: $12,345.67
 * Negative: ($1,234.56) in red (caller handles color)
 * Zero: $0.00
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '$0.00'
  const abs = Math.abs(amount)
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs)
  return amount < 0 ? `(${formatted})` : formatted
}

/**
 * Check if a currency amount is negative (for styling)
 */
export function isNegativeAmount(amount: number | null | undefined): boolean {
  return (amount ?? 0) < 0
}

/**
 * Format a date in the Empire Ops standard format
 * Short: Apr 14, 2026
 * Full: April 14, 2026
 */
export function formatDate(date: string | Date, style: 'short' | 'full' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: style === 'short' ? 'short' : 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Format a percentage with 1 decimal place
 */
export function formatPercent(value: number | null | undefined): string {
  if (value == null) return '0.0%'
  return `${value.toFixed(1)}%`
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date))
}
