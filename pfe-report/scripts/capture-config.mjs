import { chromium } from 'playwright'

const OUT = 'c:/Users/benhr/Desktop/civco-btp-main/pfe-report/img'
const BASE = 'http://127.0.0.1:5173'
const EMAIL = 'admin@civco.ma'
const PASSWORD = 'password'
const PREFERRED_ROLE = 'Expert Comptable'
const FALLBACK_ROLE = 'Comptable'

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
  await page.waitForSelector('text=Tableau de bord', { timeout: 15000 })
  await page.waitForTimeout(1000)
}

async function selectRole(page) {
  const preferred = page.locator('.role-list-item').filter({ hasText: PREFERRED_ROLE })
  if (await preferred.count()) {
    await preferred.first().click()
    return PREFERRED_ROLE
  }

  const fallback = page.locator('.role-list-item').filter({ hasText: FALLBACK_ROLE })
  if (await fallback.count()) {
    await fallback.first().click()
    return FALLBACK_ROLE
  }

  await page.locator('.role-list-item').first().click()
  return 'first available'
}

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
})

await login(page)
await page.getByRole('link', { name: 'Configuration' }).click()
await page.waitForURL('**/configuration**', { timeout: 15000 })
await page.waitForSelector('.configuration-page', { timeout: 15000 })
await page.getByRole('button', { name: 'Rôles & droits' }).click()
await page.waitForSelector('.role-list-item', { timeout: 20000 })

const selected = await selectRole(page)
await page.waitForSelector('.permission-toggle, [class*="PermissionToggle"]', { timeout: 15000 }).catch(() => {})
await page.waitForTimeout(1200)
await page.screenshot({ path: `${OUT}/config.png` })

await browser.close()
console.log(`Saved config.png (role: ${selected})`)
