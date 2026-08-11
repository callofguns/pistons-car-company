// Generates flat, placeholder PWA icons - a simple steering-wheel mark in --color-blue on
// --color-panel-dark, matching the app's stated "no gradients, no shadows, no art yet" visual
// philosophy (see src/styles/tokens.css). Pure Node (zlib for the PNG's DEFLATE stream, no image
// library), so it's cheap to re-run once real branding art exists. Run with:
//   node scripts/generate-pwa-icons.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(__dirname, '../public')
mkdirSync(outDir, { recursive: true })

const BACKGROUND = hex('#1a2136') // --color-panel-dark
const MARK = hex('#3c7af6') // --color-blue

function hex(s) {
  const n = parseInt(s.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Draws the steering-wheel mark (hub + rim + 3 spokes) into an RGBA buffer of size x size. */
function drawIcon(size, { maskable = false } = {}) {
  const pixels = new Uint8Array(size * size * 4)
  const cx = size / 2
  const cy = size / 2
  // Maskable icons get cropped to a centered ~80%-diameter safe circle by the OS, so the mark
  // has to sit well inside that; regular icons can use the full canvas.
  const outerRadius = size * (maskable ? 0.3 : 0.36)
  const ringThickness = outerRadius * 0.16
  const hubRadius = outerRadius * 0.3
  const spokeHalfWidthDeg = 7
  const spokeAngles = [90, 210, 330]

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - cx
      const dy = y + 0.5 - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      let color = BACKGROUND
      if (dist <= hubRadius) {
        color = MARK
      } else if (dist <= outerRadius && dist >= outerRadius - ringThickness) {
        color = MARK
      } else if (dist > hubRadius && dist < outerRadius - ringThickness) {
        let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI
        if (angleDeg < 0) angleDeg += 360
        for (const spoke of spokeAngles) {
          const diff = Math.min(Math.abs(angleDeg - spoke), 360 - Math.abs(angleDeg - spoke))
          if (diff <= spokeHalfWidthDeg) {
            color = MARK
            break
          }
        }
      }

      const i = (y * size + x) * 4
      pixels[i] = color[0]
      pixels[i + 1] = color[1]
      pixels[i + 2] = color[2]
      pixels[i + 3] = 255
    }
  }
  return pixels
}

// --- Minimal PNG encoder (signature + IHDR/IDAT/IEND chunks, each with a CRC-32) ---

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function encodePng(pixels, size) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(size, 0)
  ihdrData.writeUInt32BE(size, 4)
  ihdrData[8] = 8 // bit depth
  ihdrData[9] = 6 // color type: RGBA
  ihdrData[10] = 0
  ihdrData[11] = 0
  ihdrData[12] = 0

  // Each scanline needs a leading filter-type byte (0 = none).
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1)
    raw[rowStart] = 0
    Buffer.from(pixels.buffer, y * size * 4, size * 4).copy(raw, rowStart + 1)
  }
  const idatData = deflateSync(raw)

  return Buffer.concat([signature, chunk('IHDR', ihdrData), chunk('IDAT', idatData), chunk('IEND', Buffer.alloc(0))])
}

function writeIcon(filename, size, options) {
  const pixels = drawIcon(size, options)
  const png = encodePng(pixels, size)
  const dest = path.join(outDir, filename)
  writeFileSync(dest, png)
  console.log(`wrote ${filename} (${size}x${size}, ${png.length} bytes)`)
}

writeIcon('pwa-192x192.png', 192)
writeIcon('pwa-512x512.png', 512)
writeIcon('maskable-512x512.png', 512, { maskable: true })
writeIcon('apple-touch-icon.png', 180)
