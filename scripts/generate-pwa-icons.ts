/**
 * Generates all PWA icon assets from the source brand mark.
 *
 * Source: public/brand-source/abd-logo-source.png (1254x1254 square lockup —
 * the "AD" graphic mark above the "ABD FINANCE" wordmark). We crop out just
 * the graphic mark (the wordmark is illegible at icon sizes) and generate
 * every size/variant from that single trimmed mark, so there is one source
 * of truth and no hand-copied assets.
 *
 * Run: npx tsx scripts/generate-pwa-icons.ts
 */
import sharp from 'sharp'
import path from 'node:path'
import fs from 'node:fs'

const ROOT = path.resolve(__dirname, '..')
const SOURCE = path.join(ROOT, 'public/brand-source/abd-logo-source.png')
const OUT_DIR = path.join(ROOT, 'public/icons')

// The source lockup is mark-above-wordmark; this height safely contains the
// full mark and excludes the wordmark below it (verified against the actual
// 1254x1254 source — adjust if the source logo file changes).
const MARK_CROP_HEIGHT = 655

const MASKABLE_BG = '#0B1F3F' // dark navy from the mark's gradient

/**
 * The source PNG has no alpha channel (flat white background baked in), so
 * compositing it as-is onto a colored background leaves a visible white box.
 * Keys white out to transparent, with a smooth falloff so the mark's
 * anti-aliased edges (and its dark-navy-to-blue gradient, which passes
 * nowhere near white) stay clean.
 */
async function whiteToTransparent(input: Buffer): Promise<Buffer> {
  const image = sharp(input).ensureAlpha()
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    // Distance from pure white, 0 (white) to ~441 (black). A hard cutoff below
    // NOISE_FLOOR removes JPEG/AI-generation compression speckle in the
    // "white" background; above it, alpha ramps up over a short range so the
    // mark's own anti-aliased edges still fade smoothly instead of a hard cut.
    const distanceFromWhite = Math.sqrt((255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2)
    const NOISE_FLOOR = 30
    const RAMP = 40
    const alpha = distanceFromWhite <= NOISE_FLOOR
      ? 0
      : Math.max(0, Math.min(255, Math.round(((distanceFromWhite - NOISE_FLOOR) / RAMP) * 255)))
    data[i + 3] = Math.min(data[i + 3], alpha)
  }
  return sharp(data, { raw: { width, height, channels } }).png().toBuffer()
}

async function getTrimmedMark(): Promise<Buffer> {
  const source = await sharp(SOURCE).metadata()
  if (!source.width || !source.height) throw new Error('Could not read source logo dimensions')
  const cropped = await sharp(SOURCE)
    .extract({ left: 0, top: 0, width: source.width, height: Math.min(MARK_CROP_HEIGHT, source.height) })
    .png()
    .toBuffer()
  const trimmed = await sharp(cropped).trim({ background: '#ffffff', threshold: 10 }).png().toBuffer()
  return whiteToTransparent(trimmed)
}

/** Centers the mark on a transparent square canvas with the given padding fraction. */
async function squareIcon(mark: Buffer, size: number, paddingFraction: number, background: sharp.Color): Promise<Buffer> {
  const meta = await sharp(mark).metadata()
  const markWidth = meta.width!
  const markHeight = meta.height!
  const contentSize = Math.round(size * (1 - paddingFraction * 2))
  const scale = Math.min(contentSize / markWidth, contentSize / markHeight)
  const resizedWidth = Math.round(markWidth * scale)
  const resizedHeight = Math.round(markHeight * scale)

  const resizedMark = await sharp(mark).resize(resizedWidth, resizedHeight).png().toBuffer()

  return sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ input: resizedMark, left: Math.round((size - resizedWidth) / 2), top: Math.round((size - resizedHeight) / 2) }])
    .png()
    .toBuffer()
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const mark = await getTrimmedMark()

  // Standard icons: transparent background, generous but not excessive padding.
  const icon192 = await squareIcon(mark, 192, 0.12, { r: 0, g: 0, b: 0, alpha: 0 })
  fs.writeFileSync(path.join(OUT_DIR, 'icon-192.png'), icon192)

  const icon512 = await squareIcon(mark, 512, 0.12, { r: 0, g: 0, b: 0, alpha: 0 })
  fs.writeFileSync(path.join(OUT_DIR, 'icon-512.png'), icon512)

  // apple-touch-icon: solid background required (iOS does not honor alpha — a
  // transparent PNG renders with a black fill on the home screen).
  const appleTouchIcon = await squareIcon(mark, 180, 0.14, MASKABLE_BG)
  fs.writeFileSync(path.join(OUT_DIR, 'apple-touch-icon.png'), appleTouchIcon)

  // Maskable icon: solid background, mark kept within the ~80%-diameter safe
  // zone (40% padding fraction total = 20% per side) per the maskable spec —
  // OS-applied mask shapes (circle, squircle, rounded-square) will clip
  // anything outside that zone.
  const maskable512 = await squareIcon(mark, 512, 0.2, MASKABLE_BG)
  fs.writeFileSync(path.join(OUT_DIR, 'icon-maskable-512.png'), maskable512)

  console.log('Generated:', fs.readdirSync(OUT_DIR).join(', '))
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
