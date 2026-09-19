import { expect, test } from '@playwright/test'

async function start(page: import('@playwright/test').Page) {
  await page.goto('/?speed=10')
  await page.getByRole('button', { name: 'Start workday' }).click()
  const gotIt = page.getByRole('button', { name: /Got it/ })
  if (await gotIt.isVisible()) await gotIt.click()
}

test('landing, tutorial, a decision, result persistence, and share fallback', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.addInitScript(() => Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }))
  await start(page)
  const ignore = page.getByRole('button', { name: /Ignore/ }).first()
  await expect(ignore).toBeVisible({ timeout: 3000 })
  await ignore.click()
  await expect(page.getByText(/Good call|Decision made/)).toBeVisible()
  await expect(page.getByText('WORKDAY COMPLETE')).toBeVisible({ timeout: 25_000 })
  await page.getByRole('button', { name: 'Share result' }).click()
  await expect(page.getByText('Result copied!')).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('Notification Apocalypse')
  const bestScore = await page.evaluate(() => JSON.parse(localStorage.getItem('notification-apocalypse:v1') || '{}').bestScore as number)
  expect(bestScore).toBeGreaterThan(0)
  await page.reload()
  await expect(page.getByText('Personal best')).toBeVisible()
})

test('keyboard triage controls work', async ({ page }) => {
  await start(page)
  await expect(page.getByRole('button', { name: /Ignore/ }).first()).toBeVisible({ timeout: 3000 })
  await page.keyboard.press('1')
  await expect(page.getByText(/Good call|Decision made|Important alert missed/)).toBeVisible()
})

test('production incident can be investigated and rolled back', async ({ page }) => {
  await start(page)
  const alert = page.getByRole('heading', { name: 'Checkout error rate is above 18%' })
  await expect(alert).toBeVisible({ timeout: 17_000 })
  const card = alert.locator('..')
  await card.getByRole('button', { name: /Open/ }).click()
  await page.getByRole('button', { name: 'Investigate' }).click()
  const rollback = page.getByRole('heading', { name: 'Production rollback requires approval' })
  await expect(rollback).toBeVisible({ timeout: 3000 })
  await rollback.locator('..').getByRole('button', { name: /Open/ }).click()
  await page.getByRole('button', { name: 'Approve rollback' }).click()
  await expect(page.getByText(/Service restored/)).toBeVisible()
})

test('ignoring rollback approval triggers catastrophic failure', async ({ page }) => {
  await start(page)
  const alert = page.getByRole('heading', { name: 'Checkout error rate is above 18%' })
  await expect(alert).toBeVisible({ timeout: 17_000 })
  await alert.locator('..').getByRole('button', { name: /Open/ }).click()
  await page.getByRole('button', { name: 'Investigate' }).click()
  const rollback = page.getByRole('heading', { name: 'Production rollback requires approval' })
  await expect(rollback).toBeVisible({ timeout: 3000 })
  await rollback.locator('..').getByRole('button', { name: /Ignore/ }).click()
  await expect(page.getByRole('heading', { name: 'Production won.' })).toBeVisible({ timeout: 5000 })
})

test('mobile actions fit without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await start(page)
  await expect(page.getByRole('button', { name: /Ignore/ }).first()).toBeVisible({ timeout: 3000 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
})

test('sound preference survives reload', async ({ page }) => {
  await page.goto('/?speed=10')
  await page.getByRole('button', { name: 'Enable sound' }).click()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Mute sound' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('notification-apocalypse:v1') || '{}').soundEnabled)).toBe(true)
})
