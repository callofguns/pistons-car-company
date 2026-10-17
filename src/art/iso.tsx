import type { ReactNode } from 'react'

/**
 * A tiny isometric (2:1) drawing kit for the game's flat vector art. A room is a 10 x 10 floor
 * (x runs toward the bottom-right, y toward the bottom-left) with walls up to ROOM_HEIGHT along
 * its two back edges (the x=0 and y=0 planes). Every helper returns a Drawable carrying a depth
 * key, and drawScene() paints them back-to-front (painter's algorithm), so callers can list
 * furniture in any order.
 */

export const ROOM_SIZE = 10
export const ROOM_HEIGHT = 8

const SX = 17 // screen px per unit along x/y, horizontal component
const SY = 8.5 // ...vertical component (2:1 isometric)
const SZ = 13 // screen px per unit of height
const ORIGIN_X = 200
const ORIGIN_Y = 118

/** viewBox for a full room drawing. */
export const ROOM_VIEWBOX = '0 0 400 312'

export function project(x: number, y: number, z: number): [number, number] {
  return [ORIGIN_X + (x - y) * SX, ORIGIN_Y + (x + y) * SY - z * SZ]
}

function points(...corners: [number, number, number][]): string {
  return corners.map(([x, y, z]) => project(x, y, z).map((v) => v.toFixed(1)).join(',')).join(' ')
}

/** Multiplies a #rrggbb color's channels by `factor` (>1 lightens, <1 darkens). */
export function shade(hex: string, factor: number): string {
  const n = parseInt(hex.slice(1), 16)
  const channel = (shift: number) => Math.max(0, Math.min(255, Math.round(((n >> shift) & 255) * factor)))
  return `#${[16, 8, 0].map((s) => channel(s).toString(16).padStart(2, '0')).join('')}`
}

export interface Drawable {
  depth: number
  node: ReactNode
}

let keyCounter = 0
const nextKey = () => `iso-${keyCounter++}`

export interface BoxOptions {
  /** Override individual face colors; otherwise all three are shaded from `color`. */
  top?: string
  left?: string
  right?: string
  stroke?: string
  /** Shift this item's draw order without moving it (positive = drawn later / in front). */
  depthBias?: number
}

/** An axis-aligned box from (x, y, z) sized w (along x) x d (along y) x h (up). Draws only the
 * three faces visible from the viewer: the top, the +y face (lower-left) and the +x face
 * (lower-right). */
export function box(x: number, y: number, z: number, w: number, d: number, h: number, color: string, options: BoxOptions = {}): Drawable {
  const stroke = options.stroke ?? shade(color, 0.55)
  const top = options.top ?? shade(color, 1.18)
  const left = options.left ?? color
  const right = options.right ?? shade(color, 0.78)
  return {
    depth: x + w / 2 + y + d / 2 + z * 0.01 + (options.depthBias ?? 0),
    node: (
      <g key={nextKey()} stroke={stroke} strokeWidth={0.6} strokeLinejoin="round">
        <polygon points={points([x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h])} fill={left} />
        <polygon points={points([x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h])} fill={right} />
        <polygon points={points([x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h])} fill={top} />
      </g>
    ),
  }
}

/** A vertical cylinder standing on (cx, cy, z) - barrels, bottles, pots, lamp bases. */
export function cylinder(cx: number, cy: number, z: number, radius: number, h: number, color: string, depthBias = 0): Drawable {
  const [bx, by] = project(cx, cy, z)
  const [, ty] = project(cx, cy, z + h)
  const rx = radius * SX * Math.SQRT2
  const ry = radius * SY * Math.SQRT2
  return {
    depth: cx + cy + z * 0.01 + depthBias,
    node: (
      <g key={nextKey()} stroke={shade(color, 0.55)} strokeWidth={0.6}>
        <path d={`M${bx - rx},${ty} L${bx - rx},${by} A${rx},${ry} 0 0 0 ${bx + rx},${by} L${bx + rx},${ty} Z`} fill={shade(color, 0.85)} />
        <ellipse cx={bx} cy={ty} rx={rx} ry={ry} fill={shade(color, 1.15)} />
      </g>
    ),
  }
}

/** A potted plant: a pot plus a cluster of leaf blobs. */
export function plant(cx: number, cy: number, size = 1, potColor = '#3b3f4a', leafColor = '#3f8f4f'): Drawable[] {
  const pot = cylinder(cx, cy, 0, 0.45 * size, 0.9 * size, potColor)
  const [px, py] = project(cx, cy, 0.9 * size)
  const r = 9 * size
  const blobs: [number, number, number, number][] = [
    [0, -r * 1.6, r, 1.1],
    [-r * 0.9, -r * 0.9, r * 0.85, 0.85],
    [r * 0.9, -r * 0.8, r * 0.85, 0.95],
    [-r * 0.3, -r * 2.4, r * 0.75, 1.2],
    [r * 0.5, -r * 2.0, r * 0.7, 1.05],
  ]
  return [
    pot,
    {
      depth: pot.depth + 0.01,
      node: (
        <g key={nextKey()} stroke={shade(leafColor, 0.6)} strokeWidth={0.6}>
          {blobs.map(([dx, dy, rr, f], i) => (
            <ellipse key={i} cx={px + dx} cy={py + dy} rx={rr} ry={rr * 0.8} fill={shade(leafColor, f)} />
          ))}
        </g>
      ),
    },
  ]
}

export type Wall = 'left' | 'right'

/** A flat panel on a back wall's inner face: 'left' is the x=0 wall (spans y), 'right' is the y=0
 * wall (spans x). `from`/`to` are positions along the wall, `z1`/`z2` heights. Always drawn just
 * above the wall itself and behind every free-standing object. */
export function wallPanel(wall: Wall, from: number, to: number, z1: number, z2: number, fill: string, stroke = shade(fill, 0.6), extra?: ReactNode): Drawable {
  const corners: [number, number, number][] =
    wall === 'left'
      ? [[0.02, from, z1], [0.02, to, z1], [0.02, to, z2], [0.02, from, z2]]
      : [[from, 0.02, z1], [to, 0.02, z1], [to, 0.02, z2], [from, 0.02, z2]]
  return {
    depth: -100 + from * 0.001,
    node: (
      <g key={nextKey()}>
        <polygon points={points(...corners)} fill={fill} stroke={stroke} strokeWidth={0.8} strokeLinejoin="round" />
        {extra}
      </g>
    ),
  }
}

/** A window on a back wall: frame, glass with a sky gradient id, and mullions. */
export function wallWindow(wall: Wall, from: number, to: number, z1: number, z2: number, frame: string, glassFill: string, panes = 2): Drawable[] {
  const items: Drawable[] = [wallPanel(wall, from - 0.15, to + 0.15, z1 - 0.2, z2 + 0.2, frame), wallPanel(wall, from, to, z1, z2, glassFill, shade(frame, 0.7))]
  for (let i = 1; i < panes; i++) {
    const at = from + ((to - from) * i) / panes
    items.push(wallPanel(wall, at - 0.06, at + 0.06, z1, z2, frame))
  }
  items.push(wallPanel(wall, from, to, (z1 + z2) / 2 - 0.06, (z1 + z2) / 2 + 0.06, frame))
  return items
}

/** A simple seated or standing person facing the viewer-right, built from boxes. */
export function person(x: number, y: number, z: number, shirt: string, skin = '#e0b48c', hair = '#3a2a1e', seated = true): Drawable[] {
  const items: Drawable[] = []
  if (!seated) items.push(box(x, y, z, 0.5, 0.6, 1.6, '#2b3245'))
  const torsoZ = seated ? z : z + 1.6
  items.push(box(x, y, torsoZ, 0.55, 0.75, 1.5, shirt, { depthBias: 0.2 }))
  const [hx, hy] = project(x + 0.28, y + 0.38, torsoZ + 2.05)
  items.push({
    depth: x + y + 0.8,
    node: (
      <g key={nextKey()}>
        <circle cx={hx} cy={hy} r={6.2} fill={skin} stroke={shade(skin, 0.6)} strokeWidth={0.6} />
        <path d={`M${hx - 6.2},${hy - 0.5} A6.2,6.2 0 0 1 ${hx + 6.2},${hy - 0.5} Q${hx},${hy - 3} ${hx - 6.2},${hy - 0.5} Z`} fill={hair} />
      </g>
    ),
  })
  return items
}

/** An SVG path drawn ON a back wall: points are [position along the wall, height] pairs, so line
 * art (charts, blueprints) follows the wall's slant instead of floating off it. */
export function wallPath(wall: Wall, pts: [number, number][], stroke: string, strokeWidth = 1.4, fill = 'none'): Drawable {
  const d = pts
    .map(([along, z], i) => {
      const [sx, sy] = wall === 'left' ? project(0.02, along, z) : project(along, 0.02, z)
      return `${i === 0 ? 'M' : 'L'}${sx.toFixed(1)},${sy.toFixed(1)}`
    })
    .join(' ')
  return {
    depth: -80,
    node: <path key={nextKey()} d={fill === 'none' ? d : `${d} Z`} stroke={stroke} strokeWidth={strokeWidth} fill={fill} strokeLinejoin="round" />,
  }
}

/** Any raw SVG placed at a projected point, at an explicit depth. */
export function at(x: number, y: number, z: number, depth: number, render: (sx: number, sy: number) => ReactNode): Drawable {
  const [sx, sy] = project(x, y, z)
  return { depth, node: <g key={nextKey()}>{render(sx, sy)}</g> }
}

/** Floor slab (with a visible front edge) and the two back walls (with wall-top caps). */
export function roomShell(floor: string, wallLeft: string, wallRight: string, floorPattern?: string): Drawable[] {
  const t = 0.35 // wall thickness
  const slab = 0.6
  return [
    {
      depth: -300,
      node: (
        <g key={nextKey()} strokeLinejoin="round">
          {/* slab edges */}
          <polygon points={points([0, ROOM_SIZE, 0], [ROOM_SIZE, ROOM_SIZE, 0], [ROOM_SIZE, ROOM_SIZE, -slab], [0, ROOM_SIZE, -slab])} fill={shade(floor, 0.62)} />
          <polygon points={points([ROOM_SIZE, 0, 0], [ROOM_SIZE, ROOM_SIZE, 0], [ROOM_SIZE, ROOM_SIZE, -slab], [ROOM_SIZE, 0, -slab])} fill={shade(floor, 0.48)} />
          <polygon points={points([0, 0, 0], [ROOM_SIZE, 0, 0], [ROOM_SIZE, ROOM_SIZE, 0], [0, ROOM_SIZE, 0])} fill={floorPattern ?? floor} stroke={shade(floor, 0.6)} strokeWidth={0.8} />
        </g>
      ),
    },
    box(-t, -t, -slab, t, ROOM_SIZE + t, ROOM_HEIGHT + slab, wallLeft, { right: wallLeft, top: shade(wallLeft, 1.45), left: shade(wallLeft, 0.7), depthBias: -200 }),
    box(0, -t, -slab, ROOM_SIZE, t, ROOM_HEIGHT + slab, wallRight, { left: wallRight, top: shade(wallRight, 1.45), right: shade(wallRight, 0.6), depthBias: -199 }),
  ]
}

export function drawScene(items: Drawable[]): ReactNode {
  return [...items].sort((a, b) => a.depth - b.depth).map((d) => d.node)
}
