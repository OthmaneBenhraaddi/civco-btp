import { chromium } from 'playwright'

const OUT = 'c:/Users/benhr/Desktop/civco-btp-main/pfe-report/img'
const BASE = 'http://127.0.0.1:5173'
const EMAIL = 'admin@civco.ma'
const PASSWORD = 'password'

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
  await page.waitForSelector('text=Tableau de bord', { timeout: 15000 })
  await page.waitForTimeout(1000)
}

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
})

await login(page)
await page.getByRole('link', { name: 'Carte des chantiers' }).click()
await page.waitForURL('**/map**', { timeout: 15000 })
await page.waitForSelector('h1:text("Carte des chantiers")', { timeout: 15000 })
await page.waitForSelector('.leaflet-marker-icon', { timeout: 20000 })
await page.waitForTimeout(2500)

const markers = page.locator('.leaflet-marker-icon')
const count = await markers.count()
for (let i = 0; i < count; i += 1) {
  await markers.nth(i).click()
  await page.waitForTimeout(400)
  if (await page.locator('text=CIV-PRJ-003').isVisible()) {
    break
  }
}

await page.waitForSelector('text=CIV-PRJ-003', { timeout: 10000 })
await page.waitForTimeout(800)
await page.screenshot({ path: `${OUT}/map.png` })

await browser.close()
console.log('Saved map.png')
