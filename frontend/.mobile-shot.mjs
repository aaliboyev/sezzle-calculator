import { chromium } from '@playwright/test'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true })
await p.goto('https://calculator.aliboyev.com', { waitUntil: 'networkidle' })
await p.getByRole('button', { name: 'toggle keypad' }).tap()
for (const k of ['7', '×', '6', '=']) await p.getByRole('button', { name: k, exact: true }).tap()
await p.waitForTimeout(1200)
await p.screenshot({ path: '/private/tmp/claude-501/-Users-abror/73d5331a-f6df-4cf2-996d-f8db56af971d/scratchpad/mobile-keypad.png' })
await b.close()
