#!/usr/bin/env node
// Runs axe on every screen of the built app (Hungarian and English) and exits 1 on any
// serious or critical violation. Screens are reached by clicking, like a user would.
import { spawn } from 'node:child_process'
import AxeBuilder from '@axe-core/playwright'
import { chromium } from '@playwright/test'

const PORT = 4329
const URL = `http://localhost:${PORT}/`
const LABELS = {
  'hu-HU': { next: 'Tovább', notNow: 'Most nem', review: 'Visszanézés', settings: 'Beállítások', summary: 'Összefoglaló a konzultációhoz', help: 'Segítség', back: 'Vissza', plus: 'Izgalom növelése' },
  'en-US': { next: 'Next', notNow: 'Not now', review: 'Review', settings: 'Settings', summary: 'Summary for your appointment', help: 'Help', back: 'Back', plus: 'Increase Restlessness' },
}

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' })
const failures = []
const pairs = new Set()
try {
  await waitForServer()
  const browser = await chromium.launch()
  for (const [locale, l] of Object.entries(LABELS)) {
    const context = await browser.newContext({ locale, viewport: { width: 393, height: 852 } })
    const page = await context.newPage()
    const check = async (screen) => {
      const { violations } = await new AxeBuilder({ page }).analyze()
      const bad = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
      for (const v of bad.filter((v) => v.id === 'color-contrast')) {
        for (const node of v.nodes) {
          const d = node.any[0]?.data
          if (d) pairs.add(`${d.fgColor} on ${d.bgColor} = ${d.contrastRatio}:1 (${d.fontSize}, ${d.fontWeight})`)
        }
      }
      for (const v of bad) failures.push(`${locale} ${screen}: ${v.id} (${v.impact}) — ${v.nodes.length}× ${v.help}`)
      console.log(
        `${locale} ${screen}: ${violations.length} issues (${violations.map((v) => `${v.id}:${v.impact}`).join(', ')}), ${bad.length} serious/critical`,
      )
    }
    const tap = (name) => page.getByRole('button', { name, exact: true }).first().click()

    await page.goto(URL)
    await page.getByRole('button', { name: l.next, exact: true }).waitFor()
    for (let step = 1; step <= 5; step++) {
      await check(`onboarding ${step}/5`)
      if (step < 5) await tap(l.next)
    }
    await tap(l.notNow)
    await tap(l.plus)
    await check('entry')
    await tap(l.review)
    await check('review')
    await tap(l.settings)
    await check('settings')
    await page.getByRole('button', { name: l.summary }).first().click()
    await check('summary')
    await tap(`← ${l.back}`)
    await page.getByRole('button', { name: l.help, exact: true }).last().click()
    await check('help')
    await context.close()
  }
  await browser.close()
} finally {
  server.kill()
}

for (const pair of pairs) console.error(`contrast: ${pair}`)
if (failures.length > 0) {
  for (const failure of failures) console.error(failure)
  process.exit(1)
}
console.log('a11y: no serious or critical issues')

async function waitForServer() {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(URL)).ok) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error('vite preview did not start')
}
