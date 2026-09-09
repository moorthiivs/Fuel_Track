export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatLitres(litres: number): string {
  return `${litres.toFixed(2)} L`
}

export function formatDistance(km: number): string {
  return `${new Intl.NumberFormat('en-IN').format(km)} km`
}

export function formatRate(rate: number): string {
  return `₹${rate.toFixed(2)}/L`
}

export function formatMileage(kmPerLitre: number | undefined): string {
  if (!kmPerLitre || isNaN(kmPerLitre) || kmPerLitre <= 0) return '-- km/L'
  return `${kmPerLitre.toFixed(2)} km/L`
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function getConfidenceBadgeProps(score: number): {
  color: string
  label: string
  compactLabel: string
  needsVerification: boolean
} {
  if (score >= 95) {
    return {
      color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      label: `${score}% confidence`,
      compactLabel: `${score}%`,
      needsVerification: false,
    }
  }
  if (score >= 90) {
    return {
      color: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
      label: `${score}% confidence`,
      compactLabel: `${score}%`,
      needsVerification: false,
    }
  }
  return {
    color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    label: `${score}% ⚠ Please verify`,
    compactLabel: `${score}%`,
    needsVerification: true,
  }
}
