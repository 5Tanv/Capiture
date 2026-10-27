const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const plain = new Intl.NumberFormat('en-US')
const usdCents = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const formatMoney = (n: number) => usd.format(n)
export const formatNumber = (n: number) => plain.format(n)
/** Dollars and cents, for lives whose money is tracked to the cent. */
export const formatMoneyExact = (n: number) => usdCents.format(n)

/** Signed money, e.g. "+$180" or "−$65". Uses a true minus sign. */
export function formatDelta(n: number) {
  if (n === 0) return '$0'
  return `${n > 0 ? '+' : '\u2212'}${usd.format(Math.abs(n))}`
}

/** Compact money for tight HUD spaces: $420, $3.2K, $140K. */
export function formatMoneyShort(n: number) {
  const abs = Math.abs(n)
  const sign = n < 0 ? '\u2212' : ''
  if (abs < 10000) return sign + usd.format(abs)
  if (abs < 1_000_000) return `${sign}$${(abs / 1000).toFixed(abs < 100000 ? 1 : 0)}K`
  return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
}
