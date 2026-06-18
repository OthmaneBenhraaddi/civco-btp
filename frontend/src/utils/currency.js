export function formatMoney(amount, locale = 'fr') {
  const { amount: formattedAmount, currency } = formatMoneyParts(amount, locale)
  return `${formattedAmount} ${currency}`.trim()
}

export function formatMoneyParts(amount, locale = 'fr') {
  const numberLocale = locale === 'fr' ? 'fr-MA' : 'en-MA'

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
