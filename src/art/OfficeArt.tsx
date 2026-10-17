import { useId, type ReactNode } from 'react'
import {
  ROOM_HEIGHT,
  ROOM_SIZE,
  ROOM_VIEWBOX,
  at,
  box,
  cylinder,
  drawScene,
  person,
  plant,
  project,
  roomShell,
  shade,
  wallPanel,
  wallPath,
  wallWindow,
  type Drawable,
  type Wall,
} from './iso'

/** Evenly spaced lines across the floor, parallel to one axis - planks, tiles, marble seams. */
function floorLines(axis: 'x' | 'y', count: number, color: string, opacity = 0.35): Drawable {
  const lines: ReactNode[] = []
  for (let i = 1; i < count; i++) {
    const t = (ROOM_SIZE * i) / count
    const [a, b] = axis === 'x' ? [project(0, t, 0), project(ROOM_SIZE, t, 0)] : [project(t, 0, 0), project(t, ROOM_SIZE, 0)]
    lines.push(<line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />)
  }
  return {
    depth: -250,
    node: (
      <g key={`floor-${axis}-${count}-${color}`} stroke={color} strokeWidth={0.7} opacity={opacity}>
        {lines}
      </g>
    ),
  }
}

/** Horizontal courses on a back wall - brick, wood paneling. */
function wallLines(wall: Wall, count: number, color: string, opacity = 0.3): Drawable {
  const lines: ReactNode[] = []
  for (let i = 1; i < count; i++) {
    const z = (ROOM_HEIGHT * i) / count
    const [a, b] = wall === 'left' ? [project(0, 0, z), project(0, ROOM_SIZE, z)] : [project(0, 0, z), project(ROOM_SIZE, 0, z)]
    lines.push(<line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />)
  }
  return {
    depth: -150,
    node: (
      <g key={`wall-${wall}-${count}`} stroke={color} strokeWidth={0.7} opacity={opacity}>
        {lines}
      </g>
    ),
  }
}

/** A row of books on a shelf (thin colored boxes standing side by side along x). */
function books(x: number, y: number, z: number, length: number, depth: number, colors: string[]): Drawable[] {
  const items: Drawable[] = []
  const width = 0.22
  let cursor = x
  let i = 0
  while (cursor + width <= x + length) {
    const h = 0.7 + ((i * 37) % 5) * 0.06
    items.push(box(cursor, y, z, width, depth, h, colors[i % colors.length], { depthBias: 0.05 }))
    cursor += width + 0.02
    i++
  }
  return items
}

/** A shelving unit against the y=0 wall with books on each shelf. */
function bookcase(x: number, length: number, height: number, wood: string, bookColors: string[]): Drawable[] {
  const items: Drawable[] = [box(x, 0.05, 0, length, 0.9, height, wood)]
  const shelves = Math.floor(height / 1.3)
  for (let s = 0; s < shelves; s++) {
    // Each shelf's books sit just in front of the case's face so they read as "on the shelf".
    items.push(...books(x + 0.15, 0.95, 0.25 + s * 1.3, length - 0.3, 0.25, bookColors).map((b) => ({ ...b, depth: b.depth + 0.6 })))
  }
  return items
}

function desk(x: number, y: number, w: number, d: number, wood: string): Drawable[] {
  return [box(x, y, 0, w, d, 1.5, wood), box(x + 0.1, y + 0.1, 1.5, w - 0.2, d - 0.2, 0.08, shade(wood, 1.25), { depthBias: 0.01 })]
}

function chair(x: number, y: number, color: string): Drawable[] {
  return [box(x, y, 0.7, 0.8, 0.8, 0.25, color), box(x, y, 0.95, 0.18, 0.8, 1.3, color, { depthBias: -0.05 })]
}

function monitor(x: number, y: number, z: number): Drawable[] {
  return [
    box(x, y, z, 0.12, 0.9, 0.65, '#222833', { depthBias: 0.3 }),
    {
      depth: x + y + 0.9,
      node: (() => {
        const corners = [project(x + 0.13, y + 0.08, z + 0.08), project(x + 0.13, y + 0.82, z + 0.08), project(x + 0.13, y + 0.82, z + 0.58), project(x + 0.13, y + 0.08, z + 0.58)]
        return <polygon key={`mon-${x}-${y}`} points={corners.map((c) => c.join(',')).join(' ')} fill="#4fa3ff" opacity={0.85} />
      })(),
    },
  ]
}

function paperStack(x: number, y: number, z: number): Drawable {
  return box(x, y, z, 0.6, 0.45, 0.12, '#eef0f4', { depthBias: 0.4 })
}

function lamp(x: number, y: number, z: number, shadeColor: string): Drawable[] {
  return [cylinder(x, y, z, 0.12, 0.6, '#3a3f4a', 0.5), cylinder(x, y, z + 0.6, 0.28, 0.25, shadeColor, 0.55)]
}

function clock(wall: Wall, along: number, z: number): Drawable {
  const [cx, cy] = wall === 'left' ? project(0.02, along, z) : project(along, 0.02, z)
  return {
    depth: -90,
    node: (
      <g key={`clock-${along}`}>
        <ellipse cx={cx} cy={cy} rx={wall === 'left' ? 6 : 6} ry={8} fill="#f4f1e8" stroke="#2b2b2b" strokeWidth={1.4} />
        <line x1={cx} y1={cy} x2={cx} y2={cy - 5} stroke="#222" strokeWidth={1} />
        <line x1={cx} y1={cy} x2={cx + 3} y2={cy + 1.5} stroke="#222" strokeWidth={1} />
      </g>
    ),
  }
}

function rug(x: number, y: number, w: number, d: number, color: string, border: string): Drawable[] {
  return [
    { ...box(x, y, 0, w, d, 0.03, border, { top: border }), depth: -240 },
    { ...box(x + 0.25, y + 0.25, 0.031, w - 0.5, d - 0.5, 0.01, color, { top: color }), depth: -239 },
  ]
}

function hangingLight(x: number, y: number, color = '#ffd27a'): Drawable {
  const [tx, ty] = project(x, y, ROOM_HEIGHT)
  const [bx, by] = project(x, y, ROOM_HEIGHT - 1.6)
  return {
    depth: 500,
    node: (
      <g key={`light-${x}-${y}`}>
        <line x1={tx} y1={ty} x2={bx} y2={by} stroke="#1c1f27" strokeWidth={1} />
        <path d={`M${bx - 7},${by + 6} L${bx + 7},${by + 6} L${bx + 3},${by} L${bx - 3},${by} Z`} fill="#2f3542" />
        <ellipse cx={bx} cy={by + 7} rx={4} ry={2.2} fill={color} />
      </g>
    ),
  }
}

/* -------------------------------------------------------------------------------------------- */
/* Level 1 - Garage: concrete floor, brick walls, a roll-up door, a car on stands                 */
/* -------------------------------------------------------------------------------------------- */
function garage(ids: Ids): Drawable[] {
  const brick = '#8a4b3b'
  return [
    ...roomShell('#80848c', shade(brick, 0.95), brick),
    floorLines('x', 4, '#5a5e66', 0.45),
    floorLines('y', 4, '#5a5e66', 0.45),
    wallLines('left', 14, '#3e1f17', 0.45),
    wallLines('right', 14, '#3e1f17', 0.45),
    // Roll-up door with slats.
    wallPanel('right', 4.6, 8.8, 0, 5.6, '#a3aab6'),
    ...Array.from({ length: 9 }, (_, i) => wallPanel('right', 4.6, 8.8, 0.6 * i + 0.3, 0.6 * i + 0.36, '#7a818d', '#7a818d')),
    // Small window + pegboard with tools on the left wall.
    ...wallWindow('left', 1.4, 3.6, 4.4, 6.2, '#5a3a2a', `url(#${ids.sky})`),
    wallPanel('left', 5.2, 9.2, 2.8, 5.4, '#c8a676', '#8a6a45'),
    at(0.02, 6.2, 4.6, -80, (sx, sy) => <rect x={sx - 2} y={sy} width={4} height={14} fill="#4a5568" />),
    at(0.02, 7.4, 4.8, -80, (sx, sy) => <circle cx={sx} cy={sy + 6} r={4.5} fill="none" stroke="#c0392b" strokeWidth={2} />),
    at(0.02, 8.4, 4.6, -80, (sx, sy) => <path d={`M${sx - 4},${sy} l8,14`} stroke="#2d3748" strokeWidth={2.5} />),
    // Workbench under the pegboard.
    box(0.15, 5.2, 0, 1.4, 4, 1.9, '#8b6a45'),
    box(0.4, 6, 1.9, 0.7, 0.9, 0.5, '#c0392b'),
    // Oil barrels and a tire stack.
    cylinder(1, 1, 0, 0.55, 1.8, '#2f6fb0'),
    cylinder(2.2, 0.9, 0, 0.55, 1.8, '#c0392b'),
    ...[0, 0.45, 0.9, 1.35].map((z) => cylinder(8.7, 1.4, z, 0.6, 0.42, '#25272c', z * 0.01)),
    // The first car, up on stands.
    box(4.1, 3.1, 0, 0.4, 0.4, 0.7, '#e08a1e'),
    box(5.7, 3.1, 0, 0.4, 0.4, 0.7, '#e08a1e'),
    box(4.1, 6.6, 0, 0.4, 0.4, 0.7, '#e08a1e'),
    box(5.7, 6.6, 0, 0.4, 0.4, 0.7, '#e08a1e'),
    // Wheels poke out each side of the body; the cabin sits back from the long hood.
    ...[3.4, 6.2].flatMap((y) => [box(3.75, y, 0.55, 0.3, 0.9, 0.9, '#1f2126'), box(6.15, y, 0.55, 0.3, 0.9, 0.9, '#1f2126', { depthBias: 0.2 })]),
    box(3.9, 2.8, 0.85, 2.4, 4.6, 0.95, '#c9473a'),
    box(4.1, 4.3, 1.8, 2.0, 2.3, 0.8, '#c9473a', { depthBias: 0.1 }),
    box(4.15, 6.55, 1.83, 1.9, 0.06, 0.7, '#9fc3e6', { stroke: '#5c6f86', depthBias: 0.15 }),
    box(6.06, 4.4, 1.83, 0.06, 2.1, 0.7, '#9fc3e6', { stroke: '#5c6f86', depthBias: 0.15 }),
    box(4.3, 7.38, 1.2, 0.5, 0.04, 0.3, '#fff3c4', { depthBias: 0.3 }),
    box(5.4, 7.38, 1.2, 0.5, 0.04, 0.3, '#fff3c4', { depthBias: 0.3 }),
    // A mechanic and a little desk.
    ...person(7.3, 5.2, 0, '#2f6fe0', '#e0b48c', '#3a2a1e', false),
    ...desk(7.4, 8.2, 2.2, 1.2, '#6d5238'),
    paperStack(7.8, 8.4, 1.6),
    hangingLight(5, 5),
  ]
}

/* -------------------------------------------------------------------------------------------- */
/* Level 2 - Workshop: the reference's cozy wood-floored office                                   */
/* -------------------------------------------------------------------------------------------- */
function workshop(ids: Ids): Drawable[] {
  const wall = '#4b4a43'
  return [
    ...roomShell('#a8773f', shade(wall, 0.9), wall),
    floorLines('x', 12, '#5f3f1d', 0.5),
    // Cork board, certificate and a fire alarm on the left wall.
    wallPanel('left', 1.2, 4.2, 3.4, 6.2, '#d8bd8a', '#6b4a2a'),
    wallPanel('left', 1.6, 2.4, 4.2, 5.3, '#f4f0e6', '#c9c1b0'),
    wallPanel('left', 2.8, 3.8, 3.9, 5.0, '#f4f0e6', '#c9c1b0'),
    wallPanel('left', 5.0, 6.1, 3.8, 5.0, '#2d2a26', '#c9a227'),
    wallPanel('left', 5.25, 5.85, 4.1, 4.7, '#f4f0e6', '#f4f0e6'),
    wallPanel('left', 0.5, 0.9, 6.3, 6.8, '#c0392b', '#7a1f17'),
    // Bookshelf, window with blinds, clock on the right wall.
    ...bookcase(0.9, 2.2, 6.2, '#3d2818', ['#6b8fb5', '#d9c58b', '#8b3a3a', '#4f6b4f', '#e8e2d0']),
    ...wallWindow('right', 4.4, 8.2, 2.6, 6.2, '#ece8de', `url(#${ids.sky})`),
    wallPanel('right', 4.4, 8.2, 4.8, 6.2, '#7c7d72', '#5b5c52'),
    clock('right', 9.1, 5.6),
    // Side desk with typewriter under the window, fan.
    ...desk(4.8, 0.3, 3.6, 1.3, '#3a281a'),
    box(5.4, 0.55, 1.58, 0.9, 0.8, 0.45, '#e8e4da'),
    box(7.2, 0.55, 1.58, 0.8, 0.7, 0.6, '#5a3d28'),
    cylinder(4.3, 1.0, 1.58, 0.35, 0.7, '#8d9196', 0.4),
    // Main desk, chair, boss.
    ...rug(2.3, 3.4, 5.2, 4.6, '#7a2f2a', '#c49a5a'),
    ...chair(4.2, 3.4, '#22252c'),
    ...person(4.3, 3.55, 0.9, '#f2f2f0', '#e0b48c', '#3a2a1e'),
    ...desk(3.6, 4.9, 3.0, 1.6, '#3d2a1c'),
    paperStack(4.0, 5.2, 1.6),
    paperStack(5.4, 5.6, 1.6),
    ...lamp(6.1, 5.3, 1.6, '#3f8f4f'),
    cylinder(4.9, 6.0, 1.6, 0.25, 0.25, '#2a2a2a', 0.5),
    // Water cooler + plant.
    box(0.4, 7.7, 0, 1.1, 1.1, 2.2, '#2b2e35'),
    cylinder(0.95, 8.25, 2.2, 0.48, 1.3, '#4b9be0'),
    ...plant(6.4, 8.4, 1.25),
  ]
}

/* -------------------------------------------------------------------------------------------- */
/* Level 3 - Factory: an engineering office looking down onto the assembly floor                  */
/* -------------------------------------------------------------------------------------------- */
function factory(ids: Ids): Drawable[] {
  const wall = '#5f6b7d'
  return [
    ...roomShell('#6f7c91', shade(wall, 0.92), wall),
    floorLines('x', 6, '#4a5568', 0.5),
    floorLines('y', 6, '#4a5568', 0.5),
    // Big observation window over the factory floor (right wall).
    wallPanel('right', 0.8, 9.2, 2.2, 7.2, '#c9d1dc'),
    wallPanel('right', 1.0, 9.0, 2.4, 7.0, `url(#${ids.factoryGlass})`, '#8e99aa'),
    ...[2.1, 3.9, 5.7, 7.5].map((x) => wallPanel('right', x, x + 1.2, 2.4, 3.6, '#2f3a4c', '#2f3a4c')),
    ...[1.5, 4.2, 6.9].map((x) => wallPanel('right', x, x + 0.5, 3.6, 5.2, '#e0a43a', '#b5832a')),
    wallPanel('right', 1.0, 9.0, 6.2, 6.35, '#f2b53c', '#f2b53c'),
    ...[3.0, 5.0, 7.0].map((x) => wallPanel('right', x - 0.05, x + 0.05, 2.4, 7.0, '#c9d1dc', '#c9d1dc')),
    // Blueprint board + safety poster on the left wall.
    wallPanel('left', 1.2, 5.6, 3.0, 6.4, '#1f4f9c', '#e5ecf7'),
    // A car side-view sketched on the blueprint.
    wallPath('left', [[1.8, 3.9], [5.0, 3.9], [5.0, 4.6], [4.2, 4.8], [3.6, 5.6], [2.4, 5.6], [2.0, 4.8], [1.8, 4.7], [1.8, 3.9]], '#cfe0ff', 1),
    wallPath('left', [[2.2, 3.6], [2.5, 3.6], [2.5, 4.1], [2.2, 4.1], [2.2, 3.6]], '#cfe0ff', 1),
    wallPath('left', [[4.2, 3.6], [4.5, 3.6], [4.5, 4.1], [4.2, 4.1], [4.2, 3.6]], '#cfe0ff', 1),
    wallPath('left', [[1.5, 3.3], [5.3, 3.3]], '#cfe0ff', 0.6),
    wallPanel('left', 6.6, 8.0, 3.4, 5.6, '#f2b53c', '#9a6d12'),
    wallPanel('left', 6.9, 7.7, 4.4, 5.2, '#1c1c1c', '#1c1c1c'),
    // Drafting table + engineer.
    box(1.2, 3.0, 0, 1.6, 2.4, 1.9, '#d9dde4'),
    box(1.25, 3.05, 1.9, 1.5, 2.3, 0.12, '#f4f6fa', { depthBias: 0.05 }),
    ...person(3.1, 3.6, 0, '#f2b53c', '#c99a72', '#2a1d14', false),
    // Two desks with monitors.
    ...desk(5.0, 3.6, 1.6, 2.4, '#4a5260'),
    ...monitor(5.2, 4.3, 1.58),
    ...chair(6.8, 4.4, '#2b303b'),
    ...person(6.85, 4.55, 0.9, '#2f6fe0'),
    ...desk(5.0, 7.0, 1.6, 2.4, '#4a5260'),
    ...monitor(5.2, 7.7, 1.58),
    paperStack(5.6, 7.3, 1.58),
    // Filing cabinets, a scale model of the first car, plant.
    box(8.6, 0.3, 0, 1.1, 0.9, 2.6, '#8a94a6'),
    box(8.6, 1.3, 0, 1.1, 0.9, 2.6, '#8a94a6'),
    box(1.5, 7.8, 0, 1.4, 1.4, 1.4, '#2f3542'),
    box(1.6, 8.0, 1.4, 1.2, 1.0, 0.35, '#c9473a'),
    box(1.8, 8.2, 1.75, 0.8, 0.6, 0.3, '#bcd4ea', { depthBias: 0.05 }),
    ...plant(8.9, 8.6, 1.1),
    hangingLight(3, 6, '#e8f1ff'),
    hangingLight(7, 3, '#e8f1ff'),
  ]
}

/* -------------------------------------------------------------------------------------------- */
/* Level 4 - Industrial Park: a bright modern open-plan office with a park view                   */
/* -------------------------------------------------------------------------------------------- */
function industrialPark(ids: Ids): Drawable[] {
  const wall = '#d5dae4'
  return [
    ...roomShell('#c3c8d2', shade(wall, 0.93), wall),
    floorLines('x', 5, '#9aa1ae', 0.55),
    floorLines('y', 5, '#9aa1ae', 0.55),
    // Window strip with a park view (right wall).
    wallPanel('right', 0.6, 9.4, 1.6, 6.8, '#9aa3b2'),
    wallPanel('right', 0.75, 9.25, 1.75, 6.65, `url(#${ids.parkGlass})`, '#7e8796'),
    ...[1.6, 3.2, 5.6, 7.8].map((x, i) =>
      at(x, 0.02, 1.75, -85, (sx, sy) => (
        <g>
          <rect x={sx - 1.2} y={sy - 18} width={2.4} height={18} fill="#5b4632" />
          <ellipse cx={sx} cy={sy - 24 - (i % 2) * 4} rx={11} ry={12} fill={i % 2 ? '#3f9a55' : '#4fae62'} />
        </g>
      )),
    ),
    ...[2.9, 5.0, 7.1].map((x) => wallPanel('right', x - 0.05, x + 0.05, 1.75, 6.65, '#9aa3b2', '#9aa3b2')),
    // Big sales screen and logo on the left wall.
    wallPanel('left', 1.5, 6.2, 3.0, 6.2, '#1c2333', '#0d1119'),
    wallPath('left', [[1.9, 3.5], [2.7, 3.9], [3.5, 3.8], [4.3, 4.7], [5.1, 5.0], [5.8, 5.8]], '#4fd18b', 1.6),
    wallPath('left', [[1.9, 3.4], [2.7, 3.5], [3.5, 4.0], [4.3, 3.9], [5.1, 4.4], [5.8, 4.6]], '#4f8cff', 1.6),
    wallPanel('left', 7.2, 8.8, 4.2, 5.8, '#2f6fe0', '#2f6fe0'),
    // Meeting table with chairs.
    ...chair(1.3, 2.4, '#2f6fe0'),
    ...chair(1.3, 4.0, '#2f6fe0'),
    box(2.2, 2.0, 0, 2.2, 3.4, 1.45, '#f0f2f5'),
    ...chair(4.6, 2.4, '#2f6fe0').map((d) => ({ ...d, depth: d.depth + 0.5 })),
    ...chair(4.6, 4.0, '#2f6fe0').map((d) => ({ ...d, depth: d.depth + 0.5 })),
    ...person(4.65, 2.55, 0.9, '#e8e8e8', '#8d5e3c', '#1b1410'),
    paperStack(2.8, 2.6, 1.45),
    // Desk row with monitors.
    ...desk(6.0, 5.2, 1.4, 4.2, '#e6e8ec'),
    ...monitor(6.2, 5.6, 1.58),
    ...monitor(6.2, 7.8, 1.58),
    ...chair(7.6, 5.9, '#2b303b'),
    ...person(7.65, 6.05, 0.9, '#c94a3a', '#e0b48c', '#6b3e1e'),
    ...chair(7.6, 8.0, '#2b303b'),
    ...person(7.65, 8.15, 0.9, '#3f8f4f', '#f1c9a0', '#d9b36a'),
    ...plant(0.9, 8.8, 1.3, '#f0f2f5', '#3f9a55'),
    ...plant(9.1, 1.2, 1.1, '#f0f2f5', '#3f9a55'),
  ]
}

/* -------------------------------------------------------------------------------------------- */
/* Level 5 - Global HQ: a top-floor executive suite over the city at night                        */
/* -------------------------------------------------------------------------------------------- */
function globalHq(ids: Ids): Drawable[] {
  const panel = '#4a3328'
  return [
    ...roomShell('#2b3042', shade(panel, 0.95), panel),
    floorLines('x', 4, '#4a5168', 0.7),
    floorLines('y', 4, '#4a5168', 0.7),
    wallLines('left', 8, '#2a1c15', 0.5),
    // Floor-to-ceiling window over the night skyline (right wall).
    wallPanel('right', 0.5, 9.5, 0.4, 7.6, '#1a1d26'),
    wallPanel('right', 0.65, 9.35, 0.55, 7.45, `url(#${ids.night})`, '#1a1d26'),
    ...[
      [1.0, 2.3, 4.6],
      [2.4, 3.3, 6.2],
      [3.5, 4.9, 3.8],
      [5.1, 6.0, 5.4],
      [6.2, 7.6, 6.8],
      [7.8, 9.2, 4.2],
    ].map(([x1, x2, top]) => wallPanel('right', x1, x2, 0.55, top, '#141a2c', '#0b0f1a')),
    ...Array.from({ length: 22 }, (_, i) => {
      const x = 1.2 + ((i * 2.9) % 7.8)
      const z = 1.0 + ((i * 1.7) % 3.4)
      return wallPanel('right', x, x + 0.18, z, z + 0.25, '#ffd27a', '#ffd27a')
    }),
    ...[3.3, 6.2].map((x) => wallPanel('right', x - 0.07, x + 0.07, 0.55, 7.45, '#1a1d26', '#1a1d26')),
    // Trophy shelf, painting and logo on the paneled left wall.
    wallPanel('left', 1.0, 3.6, 3.6, 6.4, '#c9a227', '#7a5f18'),
    wallPanel('left', 1.15, 3.45, 3.75, 6.25, `url(#${ids.painting})`, '#7a5f18'),
    box(0.1, 4.6, 0, 0.9, 4.0, 2.4, '#2a1c15'),
    ...[5.0, 6.2, 7.4].map((y, i) => cylinder(0.55, y, 2.4, 0.25, 0.8 + (i % 2) * 0.3, '#f2b53c', 0.1)),
    // Executive desk, chair, CEO.
    ...rug(2.6, 2.6, 5.6, 5.2, '#7a1f2a', '#c9a227'),
    ...chair(4.0, 2.8, '#15171d'),
    box(4.0, 2.8, 0.95, 0.2, 0.8, 1.8, '#15171d', { depthBias: -0.05 }),
    ...person(4.1, 2.95, 0.9, '#1f2533', '#e0b48c', '#9aa0a8'),
    ...desk(3.4, 4.1, 3.6, 1.8, '#5a3a22'),
    ...monitor(3.7, 4.5, 1.58),
    ...lamp(6.3, 4.4, 1.58, '#f2b53c'),
    paperStack(5.0, 4.9, 1.58),
    // Globe on a stand.
    cylinder(8.6, 3.3, 0, 0.18, 1.6, '#c9a227'),
    at(8.6, 3.3, 2.15, 8.6 + 3.3 + 0.1, (sx, sy) => (
      <g>
        <circle cx={sx} cy={sy} r={10} fill="#3d7dc4" stroke="#c9a227" strokeWidth={1.4} />
        <path d={`M${sx - 6},${sy - 4} q4,-3 7,0 q2,4 -2,6 q-4,1 -5,-6 z M${sx + 3},${sy + 2} q4,0 4,4 q-3,2 -5,-1 z`} fill="#4fae62" />
      </g>
    )),
    // Leather sofa + coffee table.
    box(6.2, 8.3, 0, 3.4, 1.2, 0.9, '#6b3a24'),
    box(6.2, 9.1, 0.9, 3.4, 0.4, 0.9, '#6b3a24', { depthBias: 0.1 }),
    box(7.0, 6.9, 0, 1.8, 1.0, 0.7, '#1a1d26', { top: '#3a4256' }),
    ...plant(1.2, 9.0, 1.4, '#c9a227', '#3f8f4f'),
    hangingLight(5.2, 5.2, '#ffd27a'),
  ]
}

interface Ids {
  sky: string
  factoryGlass: string
  parkGlass: string
  night: string
  painting: string
}

const SCENES: Record<number, (ids: Ids) => Drawable[]> = {
  1: garage,
  2: workshop,
  3: factory,
  4: industrialPark,
  5: globalHq,
}

interface OfficeArtProps {
  /** HQ level 1-5 (Garage, Workshop, Factory, Industrial Park, Global HQ). */
  level: number
  className?: string
  title?: string
}

/** The isometric cut-away office drawn at the center of the Office screen - one scene per HQ
 * level, so upgrading the HQ visibly changes the room. Pure vector, no image assets. */
export function OfficeArt({ level, className, title }: OfficeArtProps) {
  const uid = useId().replace(/:/g, '')
  const ids: Ids = {
    sky: `${uid}-sky`,
    factoryGlass: `${uid}-factory`,
    parkGlass: `${uid}-park`,
    night: `${uid}-night`,
    painting: `${uid}-painting`,
  }
  const scene = (SCENES[level] ?? SCENES[1])(ids)

  return (
    <svg className={className} viewBox={ROOM_VIEWBOX} role="img" aria-label={title} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={ids.sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fc4f2" />
          <stop offset="1" stopColor="#d6ecff" />
        </linearGradient>
        <linearGradient id={ids.factoryGlass} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9fb3cc" />
          <stop offset="1" stopColor="#5d6f88" />
        </linearGradient>
        <linearGradient id={ids.parkGlass} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9ed2ff" />
          <stop offset="0.75" stopColor="#d9f0ff" />
          <stop offset="0.76" stopColor="#7cc47f" />
          <stop offset="1" stopColor="#5fae63" />
        </linearGradient>
        <linearGradient id={ids.night} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1230" />
          <stop offset="1" stopColor="#3a2e6b" />
        </linearGradient>
        <linearGradient id={ids.painting} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d9895b" />
          <stop offset="0.5" stopColor="#7a4f8f" />
          <stop offset="1" stopColor="#2f4f8f" />
        </linearGradient>
        <radialGradient id={`${uid}-shadow`}>
          <stop offset="0" stopColor="#000" stopOpacity="0.45" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Soft contact shadow under the floating room, like the reference's render. */}
      <ellipse cx={200} cy={292} rx={190} ry={22} fill={`url(#${uid}-shadow)`} />
      {drawScene(scene)}
    </svg>
  )
}
