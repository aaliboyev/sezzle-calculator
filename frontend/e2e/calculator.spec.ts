import { expect, test } from '@playwright/test'
import type { MathfieldElement } from 'mathlive'

// The math-field is a custom element; read its LaTeX through the DOM.
function fieldValue(page: import('@playwright/test').Page) {
  return page.locator('math-field').evaluate((el) => (el as MathfieldElement).value)
}

// The example cards drift forever; without this Playwright waits for element
// stability that never comes. (use.reducedMotion is not honored here.)
test.beforeEach(({ page }) => page.emulateMedia({ reducedMotion: 'reduce' }))

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
  await expect(page.getByRole('button', { name: '7', exact: true })).toBeHidden()
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

test('the formula library inserts a categorized formula ready to compute', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'formula library' }).click()
  const library = page.locator('.formulas')
  await expect(library).toBeVisible()
  await expect(library).toContainText('geometry')
  await expect(library).toContainText('edge cases')
  await library.getByRole('button', { name: /golden ratio/ }).click()
  await expect(library).toBeHidden()
  await expect(page.locator('math-field')).toHaveJSProperty('value', '\\frac{1+\\sqrt{5}}{2}')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('status', { name: 'result' })).toHaveText('1.61803398875')
})

test('examples hide, then rescatter to a fresh sample and layout', async ({ page }) => {
  await page.goto('/')
  const cards = page.locator('.example')
  await expect(cards).toHaveCount(8)
  const before = await cards.first().evaluate((el) => el.getAttribute('style'))
  await page.getByRole('button', { name: 'scatter examples' }).click()
  await expect(cards).toHaveCount(0)
  await page.getByRole('button', { name: 'scatter examples' }).click()
  await expect(cards).toHaveCount(8)
  expect(await cards.first().evaluate((el) => el.getAttribute('style'))).not.toBe(before)
})

test('dock buttons stay clickable while a transition is running', async ({ page }) => {
  await page.goto('/')
  const scatter = page.getByRole('button', { name: 'scatter examples' })
  await scatter.click()
  await scatter.click()
  await expect(page.locator('.example')).toHaveCount(8)
})

test('selecting a guided formula opens its steps and diagram', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'formula library' }).click()
  await page.locator('.formulas').getByRole('button', { name: /pythagoras/ }).click()
  const guide = page.locator('.guide')
  await expect(guide).toBeVisible()
  await expect(guide).toContainText('take the root')
  await expect(guide.locator('.guide-diagram')).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('status', { name: 'result' })).toHaveText('5')
})

test('guided mode follows digit edits and drops on structure change', async ({ page }) => {
  await page.goto('/')
  const field = page.locator('math-field')
  await field.click()
  await expect(field).toBeFocused()
  await page.keyboard.type('sqrtsqrt16')
  expect(await fieldValue(page)).toBe('\\sqrt{\\sqrt{16}}')
  const guide = page.locator('.guide')
  await expect(guide).toBeVisible()
  await expect(guide).toContainText('nested roots')
  await expect(guide).toContainText('inner root')
  // digits stay free: 16 -> 100 keeps the guide, rebinding the steps
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Backspace')
  await page.keyboard.type('100')
  await expect(guide).toContainText('10')
  // structure change dims the guide as paused instead of flashing it away
  await page.keyboard.type('x')
  await expect(guide).toContainText('pattern paused')
  // emptying the field clears it entirely
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Backspace')
  await expect(guide).toBeHidden()
})
