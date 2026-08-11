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
await page.getByRole('link', { name: 'Tâches' }).click()
await page.waitForURL('**/tasks**', { timeout: 15000 })
await page.waitForSelector('h1:text("Gestion des tâches")', { timeout: 15000 })
await page.locator('.tasks-project-select').selectOption({ label: 'Résidence Anfa — rénovation façades' })
await page.waitForSelector('table tbody tr', { timeout: 20000 })
await page.waitForTimeout(1000)
await page.screenshot({ path: `${OUT}/tasks.png` })

await browser.close()
console.log('Saved tasks.png')
