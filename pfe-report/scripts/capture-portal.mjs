import { chromium } from 'playwright'

const OUT = 'c:/Users/benhr/Desktop/civco-btp-main/pfe-report/img'
const BASE = 'http://127.0.0.1:5173'
const PASSWORD = 'password'
const CLIENT_EMAILS = [
  'karim.benjelloun@alomrane.ma',
  'client.portal@civco-btp.ma',
]

async function loginClient(page) {
  for (const email of CLIENT_EMAILS) {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', PASSWORD)
    await page.click('button[type="submit"]')

    try {
      await page.waitForURL('**/portal**', { timeout: 10000 })
      console.log(`Logged in as ${email}`)
      return
    } catch {
      // try next account
    }
  }

  throw new Error('Could not log in to client portal — run: php artisan db:seed --class=ClientPortalSeeder')
}

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
})

await loginClient(page)
await page.waitForSelector('text=Avancement du chantier', { timeout: 15000 })
await page.waitForSelector('text=Villa résidentielle', { timeout: 15000 })
await page.waitForTimeout(1000)
await page.screenshot({ path: `${OUT}/portal.png` })

await browser.close()
console.log('Saved portal.png')
