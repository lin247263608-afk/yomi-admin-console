export function formatCurrency(pence: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(pence / 100)
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('zh-CN').format(value)
}

export function totalPassengers(value: { adults: number; children: number }) {
  return value.adults + value.children
}

export function formatParty(value: { adults: number; children: number }) {
  return `${totalPassengers(value)} 人（成人 ${value.adults} / 儿童 ${value.children}）`
}

export function formatLuggage(value: { largeLuggage: number; smallLuggage: number }) {
  return `大 ${value.largeLuggage} / 小 ${value.smallLuggage}`
}

export function formatLondonTime(iso: string, includeYear = false) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Europe/London',
    year: includeYear ? 'numeric' : undefined,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

export function timeUntil(iso: string) {
  const totalSeconds = Math.max(
    0,
    Math.floor((new Date(iso).getTime() - Date.now()) / 1000),
  )
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) return `${hours}小时 ${String(minutes).padStart(2, '0')}分`
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
