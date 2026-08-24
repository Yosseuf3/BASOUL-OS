import { convertIfcToPascal } from '@pascal-app/ifc-converter'

const url = 'https://raw.githubusercontent.com/pascalorg/editor/main/apps/ifc-converter/public/test-ifc-files/04-ifc-open-house.ifc'
const response = await fetch(url)
if (!response.ok) throw new Error(`IFC fixture download failed: ${response.status}`)
const bytes = new Uint8Array(await response.arrayBuffer())
const result = await convertIfcToPascal(bytes)

const nodes = Object.values(result.nodes ?? {})
const walls = nodes.filter((node) => node?.type === 'wall')
const levels = nodes.filter((node) => node?.type === 'level')
if (nodes.length < 5) throw new Error(`IFC conversion produced too few nodes: ${nodes.length}`)
if (walls.length === 0) throw new Error('IFC conversion produced no walls')
if (levels.length === 0) throw new Error('IFC conversion produced no levels')

let validWallLengths = 0
for (const wall of walls) {
  const start = 'start' in wall ? wall.start : undefined
  const end = 'end' in wall ? wall.end : undefined
  if (!Array.isArray(start) || !Array.isArray(end) || start.length < 2 || end.length < 2) continue
  const length = Math.hypot(Number(end[0]) - Number(start[0]), Number(end[1]) - Number(start[1]))
  if (Number.isFinite(length) && length > 0.05 && length < 100) validWallLengths++
}
if (validWallLengths === 0) throw new Error('IFC conversion produced no plausible metric wall lengths')

console.log(JSON.stringify({
  fixture: '04-ifc-open-house.ifc',
  bytes: bytes.length,
  nodes: nodes.length,
  levels: levels.length,
  walls: walls.length,
  plausibleMetricWalls: validWallLengths,
  stats: result.stats ?? null,
}, null, 2))
