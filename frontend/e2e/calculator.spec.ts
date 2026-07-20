import { expect, test } from '@playwright/test'

test('computes an expression typed with the keyboard', async ({ page }) => {
  await page.goto('/')
  const input = page.getByRole('textbox', { name: 'expression' })
  await input.fill('0.1+0.2')
  await input.press('Enter')
  await expect(page.getByRole('status')).toHaveText('0.3')
})

test('shows a clean error for division by zero', async ({ page }) => {
  await page.goto('/')
  const input = page.getByRole('textbox', { name: 'expression' })
  await input.fill('1/0')
  await input.press('Enter')
  await expect(page.getByRole('alert')).toHaveText('division by zero')
})

test('rejects an invalid expression with a message', async ({ page }) => {
  await page.goto('/')
  const input = page.getByRole('textbox', { name: 'expression' })
  await input.fill('2++3')
  await input.press('Enter')
  await expect(page.getByRole('alert')).toContainText('unexpected')
})

test('keypad toggles in and computes', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: '7' })).toBeHidden()
  await page.getByRole('button', { name: 'toggle keypad' }).click()
  for (const key of ['7', '×', '6', '=']) {
    await page.getByRole('button', { name: key, exact: true }).click()
  }
  await expect(page.getByRole('status')).toHaveText('42')
  await page.getByRole('button', { name: 'AC', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'expression' })).toHaveValue('')
  await expect(page.getByRole('status')).toBeHidden()
})

test('sqrt key inserts √ with the cursor inside parens', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'toggle keypad' }).click()
  for (const key of ['√', '9', ')', '=']) {
    await page.getByRole('button', { name: key, exact: true }).click()
  }
  await expect(page.getByRole('textbox', { name: 'expression' })).toHaveValue('√(9)')
  await expect(page.getByRole('status')).toHaveText('3')
})

test('typed sqrt collapses to √ and open parens close on submit', async ({ page }) => {
  await page.goto('/')
  const input = page.getByRole('textbox', { name: 'expression' })
  await input.pressSequentially('sqrt(9')
  await expect(input).toHaveValue('√(9')
  await input.press('Enter')
  await expect(input).toHaveValue('√(9)')
  await expect(page.getByRole('status')).toHaveText('3')
})

test('typed symbols are normalized and junk is dropped', async ({ page }) => {
  await page.goto('/')
  const input = page.getByRole('textbox', { name: 'expression' })
  await input.pressSequentially('8&×@2')
  await expect(input).toHaveValue('8*2')
  await input.press('Enter')
  await expect(page.getByRole('status')).toHaveText('16')
})
