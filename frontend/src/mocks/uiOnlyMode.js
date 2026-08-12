/** True when designing UI without the Laravel API. Controlled by `.env.local`. */
export function isUiOnlyMode() {
  return import.meta.env.VITE_UI_ONLY === 'true'
}
