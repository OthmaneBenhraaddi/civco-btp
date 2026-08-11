import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
})
await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.screenshot({
  path: 'c:/Users/benhr/Desktop/civco-btp-main/pfe-report/img/login.png',
})
await browser.close()
console.log('Saved full-page high-DPI login.png')
