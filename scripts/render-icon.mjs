#!/usr/bin/env node
// Renders assets/icon.svg into the source images @capacitor/assets expects.
import { readFileSync } from 'node:fs'
import sharp from 'sharp'

const svg = readFileSync(new URL('../assets/icon.svg', import.meta.url), 'utf8')
const out = (name) => new URL(`../assets/${name}`, import.meta.url).pathname
const PAPER = '#FAF6EF'
const INK = '#2B2723'

const monogram = (color) =>
  svg.replace(/<rect id="background"[^>]*\/>/, '').replaceAll('#3D6B5E', color)

await sharp(Buffer.from(svg)).resize(1024, 1024).png().toFile(out('icon-only.png'))
await sharp(Buffer.from(monogram('#3D6B5E'))).resize(1024, 1024).png().toFile(out('icon-foreground.png'))
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: PAPER } })
  .png()
  .toFile(out('icon-background.png'))

// Splash: the monogram at 800 px on a 2732 px square, light and dark.
for (const [name, background, color] of [
  ['splash.png', PAPER, '#3D6B5E'],
  ['splash-dark.png', INK, PAPER],
]) {
  const mark = await sharp(Buffer.from(monogram(color))).resize(800, 800).png().toBuffer()
  await sharp({ create: { width: 2732, height: 2732, channels: 4, background } })
    .composite([{ input: mark, gravity: 'centre' }])
    .png()
    .toFile(out(name))
}
console.log('render-icon: assets/icon-only.png, icon-foreground.png, icon-background.png, splash.png, splash-dark.png')
