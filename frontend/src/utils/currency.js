export function formatMoney(amount) {
  const { amount: formattedAmount, currency } = formatMoneyParts(amount)
  return `${formattedAmount} ${currency}`.trim()
}

export function formatMoneyParts(amount) {
  const numberLocale = 'fr-MA'

  const parts = new Intl.NumberFormat(numberLocale, {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).formatToParts(amount ?? 0)

  let currency = 'MAD'
  let formattedAmount = ''

  for (const part of parts) {
    if (part.type === 'currency') {
      currency = part.value.trim()
    } else {
      formattedAmount += part.value
    }
  }

  return {
    amount: formattedAmount.trim(),
    currency,
  }
}
