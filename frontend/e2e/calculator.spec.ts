import { expect, test } from '@playwright/test'
import type { MathfieldElement } from 'mathlive'

// The math-field is a custom element; read its LaTeX through the DOM.
function fieldValue(page: import('@playwright/test').Page) {
  return page.locator('math-field').evaluate((el) => (el as MathfieldElement).value)
}

test('computes an expression typed with the keyboard', async ({ page }) => {
  await page.goto('/')
  const field = page.locator('math-field')
  await field.click()
  await expect(field).toBeFocused()
  await page.keyboard.type('0.1+0.2')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('status', { name: 'result' })).toHaveText('0.3')
})

test('typing / builds a fraction and division by zero errors cleanly', async ({ page }) => {
  await page.goto('/')
  const field = page.locator('math-field')
  await field.click()
  await expect(field).toBeFocused()
  await page.keyboard.type('1/0')
  expect(await fieldValue(page)).toBe('\\frac10')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('alert')).toHaveText('division by zero')
})

test('rejects an incomplete expression without contacting the server', async ({ page }) => {
  await page.goto('/')
  const field = page.locator('math-field')
  await field.click()
  await expect(field).toBeFocused()
  await page.keyboard.type('2+')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('alert')).toHaveText('incomplete or invalid expression')
})

test('rejects unsupported math with the offending symbol named', async ({ page }) => {
  await page.goto('/')
  const field = page.locator('math-field')
  await field.click()
  await expect(field).toBeFocused()
  await page.keyboard.type('x+1')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('alert')).toHaveText('unsupported: x')
})

test('keypad toggles in and computes', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: '7' })).toBeHidden()
  await page.getByRole('button', { name: 'toggle keypad' }).click()
  for (const key of ['7', '×', '6', '=']) {
    await page.getByRole('button', { name: key, exact: true }).click()
  }
  await expect(page.getByRole('status', { name: 'result' })).toHaveText('42')
  await page.getByRole('button', { name: 'AC', exact: true }).click()
  expect(await fieldValue(page)).toBe('')
  await expect(page.getByRole('status', { name: 'result' })).toBeHidden()
})

test('sqrt keypad key builds a radical with the caret inside', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'toggle keypad' }).click()
  for (const key of ['√', '9', '=']) {
    await page.getByRole('button', { name: key, exact: true }).click()
  }
  expect(await fieldValue(page)).toBe('\\sqrt9')
  await expect(page.getByRole('status', { name: 'result' })).toHaveText('3')
})

test('typing sqrt becomes a real radical', async ({ page }) => {
  await page.goto('/')
  const field = page.locator('math-field')
  await field.click()
  await expect(field).toBeFocused()
  await page.keyboard.type('sqrt9')
  expect(await fieldValue(page)).toBe('\\sqrt9')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('status', { name: 'result' })).toHaveText('3')
})

// Native Cmd+V cannot be synthesized in headless, so the paste event is
// dispatched directly at MathLive's keyboard sink with LaTeX on the clipboard.
test('pasted LaTeX renders and evaluates', async ({ page }) => {
  await page.goto('/')
  const field = page.locator('math-field')
  await field.click()
  await expect(field).toBeFocused()
  await field.evaluate((el) => {
    const sink = el.shadowRoot?.querySelector('.ML__keyboard-sink')
    const data = new DataTransfer()
    data.setData('text/plain', '\\frac{\\sqrt{16}+2}{3}')
    sink?.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
    )
  })
  await expect
    .poll(async () => fieldValue(page))
    .toBe('\\frac{\\sqrt{16}+2}{3}')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('status', { name: 'result' })).toHaveText('2')
})

test('percent resolves through the translator', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'toggle keypad' }).click()
  for (const key of ['5', '0', '%', '=']) {
    await page.getByRole('button', { name: key, exact: true }).click()
  }
  await expect(page.getByRole('status', { name: 'result' })).toHaveText('0.5')
})

test('long formulas stay reachable at both ends', async ({ page }) => {
  await page.goto('/')
  const field = page.locator('math-field')
  await field.click()
  await expect(field).toBeFocused()
  await page.keyboard.type('1234567890+'.repeat(12) + '5')
  const scrollState = () =>
    field.evaluate((el) => {
      const content = el.shadowRoot!.querySelector('.ML__content')!
      return { left: content.scrollLeft, overflow: content.scrollWidth - content.clientWidth }
    })
  const atEnd = await scrollState()
  expect(atEnd.overflow).toBeGreaterThan(0)
  expect(atEnd.left).toBeGreaterThan(0)
  await page.keyboard.press('Home')
  await expect.poll(async () => (await scrollState()).left).toBe(0)
})

test('history records, dedupes, recalls, and persists across reload', async ({ page }) => {
  await page.goto('/')
  const field = page.locator('math-field')
  const result = page.getByRole('status', { name: 'result' })
  await field.click()
  await expect(field).toBeFocused()

  await page.keyboard.type('7*6')
  await page.keyboard.press('Enter')
  await expect(result).toHaveText('42')
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('1+1')
  await page.keyboard.press('Enter')
  await expect(result).toHaveText('2')

  await page.getByRole('button', { name: 'toggle history' }).click()
  const entries = page.locator('.history-entry')
  await expect(entries).toHaveCount(2)
  await expect(entries.first()).toContainText('= 2')

  // recall the older entry, recompute: dedupe moves it to the top
  await entries.nth(1).click()
  await expect(field).toHaveJSProperty('value', '7\\cdot6')
  await page.keyboard.press('Enter')
  await expect(result).toHaveText('42')
  await page.getByRole('button', { name: 'toggle history' }).click()
  await expect(entries).toHaveCount(2)
  await expect(entries.first()).toContainText('= 42')

  await page.reload()
  await page.getByRole('button', { name: 'toggle history' }).click()
  await expect(entries).toHaveCount(2)

  await page.getByRole('button', { name: 'clear history' }).click()
  await expect(entries).toHaveCount(0)
  await expect(page.locator('.history-empty')).toBeVisible()
})
