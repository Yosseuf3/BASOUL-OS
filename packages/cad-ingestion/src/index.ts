import type { ArchitectureNode, ArchitectureScene } from '../../architecture-engine/src/index'

export type CadEntityType = 'LINE' | 'LWPOLYLINE' | 'POLYLINE' | 'ARC' | 'CIRCLE' | 'INSERT' | 'TEXT' | 'MTEXT' | 'DIMENSION' | 'HATCH' | 'UNKNOWN'

export interface CadPoint { x: number; y: number; z?: number }
export interface CadLayer { name: string; color?: number | null; flags?: number | null }
export interface CadBlock { name: string; entityCount: number }
export interface CadTextStyle { name: string; font?: string | null; bigFont?: string | null }

export interface CadEntity {
  id: string
  type: CadEntityType
  layer: string
  blockName?: string | null
  text?: string | null
  points?: CadPoint[]
  insert?: CadPoint | null
  rotation?: number | null
  scale?: { x: number; y: number; z: number } | null
  closed?: boolean | null
  measurement?: number | null
  metadata?: Record<string, unknown>
}

export interface NormalizedCadDocument {
  schema: 'basoul.cad.v1'
  source: { format: 'dwg' | 'dxf'; filename: string; converter: string; codepage?: string | null }
  units?: string | null
  layers: CadLayer[]
  blocks: CadBlock[]
  textStyles?: CadTextStyle[]
  entities: CadEntity[]
}

export interface CadClassificationRule {
  kind: 'wall' | 'door' | 'window' | 'room' | 'stair' | 'column' | 'dimension' | 'label' | 'item'
  confidence: number
  reason: string
}

const match = (value: string | null | undefined, pattern: RegExp) => pattern.test(value ?? '')
const architecturalSpace = /room|bed|living|kitchen|bath|toilet|wc|hall|corridor|majlis|office|garage|store|laundry|dining|shop|elevator|shaft|غرفة|حمام|مطبخ|صالة|مجلس|ممر|محل|مكتب|مستودع|مصعد|منور/i
const geometryEntityTypes: CadEntityType[] = ['LINE', 'LWPOLYLINE', 'POLYLINE', 'ARC']
const isGeometry = (entity: CadEntity) => geometryEntityTypes.includes(entity.type)
const doorBlockPattern = /door|(?:^|[_-])dr(?:[_-]|$)|^dr[_-]|باب/i
const windowBlockPattern = /window|win(?:[_-]|$)|^wd[_-]|نافذ/i

export function classifyCadEntity(entity: CadEntity): CadClassificationRule {
  const layer = entity.layer.toLowerCase()
  const block = (entity.blockName ?? '').toLowerCase()
  const text = entity.text ?? ''

  if (entity.type === 'DIMENSION') return { kind: 'dimension', confidence: 0.99, reason: 'Native CAD DIMENSION entity.' }
  if ((entity.type === 'TEXT' || entity.type === 'MTEXT') && match(text, architecturalSpace)) return { kind: 'room', confidence: 0.84, reason: 'Semantic room label from native CAD text.' }
  if (entity.type === 'TEXT' || entity.type === 'MTEXT') return { kind: 'label', confidence: 0.92, reason: 'Native CAD text entity.' }

  if (entity.type === 'INSERT' && match(block, doorBlockPattern)) return { kind: 'door', confidence: 0.98, reason: 'Door block semantics.' }
  if (entity.type === 'INSERT' && match(block, windowBlockPattern)) return { kind: 'window', confidence: 0.98, reason: 'Window block semantics.' }
  if (entity.type === 'INSERT' && match(block, /stair|stairs|step|درج|سلم/)) return { kind: 'stair', confidence: 0.96, reason: 'Stair block semantics.' }
  if (entity.type === 'INSERT' && match(block, /column|col(?:[_-]|$)|عمود/)) return { kind: 'column', confidence: 0.96, reason: 'Column block semantics.' }

  if (entity.type === 'INSERT' && match(layer, /door|a-door|باب/)) return { kind: 'door', confidence: 0.94, reason: 'Door layer semantics.' }
  if (entity.type === 'INSERT' && match(layer, /window|a-glaz|نافذ/)) return { kind: 'window', confidence: 0.94, reason: 'Window layer semantics.' }
  if (entity.type === 'INSERT' && match(layer, /stair|stairs|stiars|a-stair|درج|سلم/)) return { kind: 'stair', confidence: 0.94, reason: 'Stair layer semantics.' }
  if (entity.type === 'INSERT' && match(layer, /column|a-col|عمود/)) return { kind: 'column', confidence: 0.94, reason: 'Column layer semantics.' }

  if (isGeometry(entity) && match(layer, /wall|a-wall|walls|جدار|حوائط/)) return { kind: 'wall', confidence: 0.97, reason: 'Geometry is explicitly on a wall layer.' }
  if (isGeometry(entity) && match(layer, /door|a-door|باب/)) return { kind: 'door', confidence: 0.88, reason: 'Native CAD geometry is explicitly on a door layer.' }
  if (isGeometry(entity) && match(layer, /window|a-glaz|glaz|نافذ/)) return { kind: 'window', confidence: 0.88, reason: 'Native CAD geometry is explicitly on a window layer.' }
  if (isGeometry(entity) && match(layer, /stair|stairs|stiars|a-stair|step|درج|سلم/)) return { kind: 'stair', confidence: 0.9, reason: 'Native CAD geometry is explicitly on a stair layer.' }
  if (isGeometry(entity) && match(layer, /column|a-col|عمود/)) return { kind: 'column', confidence: 0.9, reason: 'Native CAD geometry is explicitly on a column layer.' }

  if (['LWPOLYLINE','POLYLINE','HATCH'].includes(entity.type) && entity.closed && match(layer, /room|space|area|zone|غرف|فراغ/)) return { kind: 'room', confidence: 0.9, reason: 'Closed room/space geometry.' }
  return { kind: 'item', confidence: 0.45, reason: 'Unclassified CAD entity retained for review.' }
}

function nodeFromEntity(entity: CadEntity): ArchitectureNode | null {
  const classification = classifyCadEntity(entity)
  const common = {
    id: `cad:${entity.id}`,
    type: classification.kind,
    metadata: {
      cadEntityType: entity.type,
      layer: entity.layer,
      blockName: entity.blockName ?? null,
      textStyle: entity.metadata?.textStyle ?? null,
      font: entity.metadata?.font ?? null,
      bigFont: entity.metadata?.bigFont ?? null,
      confidence: classification.confidence,
      classificationReason: classification.reason,
      source: 'cad',
    },
  } satisfies ArchitectureNode

  if (classification.kind === 'wall') {
    const points = entity.points ?? []
    if (points.length < 2) return null
    return { ...common, start: points[0], end: points[points.length - 1], path: points, thickness: entity.metadata?.lineweight ?? null }
  }
  if (classification.kind === 'door' || classification.kind === 'window' || classification.kind === 'stair' || classification.kind === 'column') {
    if (!entity.insert) {
      const points = entity.points ?? []
      return { ...common, path: points, points, transform: { rotation: entity.rotation ?? 0, scale: entity.scale ?? { x: 1, y: 1, z: 1 } } }
    }
    return { ...common, position: entity.insert, transform: { rotation: entity.rotation ?? 0, scale: entity.scale ?? { x: 1, y: 1, z: 1 } } }
  }
  if (classification.kind === 'room') return { ...common, boundary: entity.points ?? [], label: entity.text ?? entity.blockName ?? 'Room' }
  if (classification.kind === 'dimension') return { ...common, value: entity.measurement ?? null, points: entity.points ?? [] }
  if (classification.kind === 'label') return { ...common, text: entity.text ?? '' }
  return common
}

export function cadDocumentToArchitectureScene(document: NormalizedCadDocument): ArchitectureScene {
  const rootId = 'cad:root'
  const nodes: Record<string, ArchitectureNode> = {
    [rootId]: {
      id: rootId,
      type: 'level',
      metadata: {
        sourceFormat: document.source.format,
        filename: document.source.filename,
        units: document.units ?? null,
        converter: document.source.converter,
        codepage: document.source.codepage ?? null,
      },
    },
  }

  for (const entity of document.entities) {
    const node = nodeFromEntity(entity)
    if (!node) continue
    nodes[node.id] = { ...node, parentId: rootId }
  }

  return {
    nodes,
    rootNodeIds: [rootId],
    metadata: {
      source: 'cad',
      cadSchema: document.schema,
      layerCount: document.layers.length,
      blockCount: document.blocks.length,
      textStyleCount: document.textStyles?.length ?? 0,
      entityCount: document.entities.length,
    },
  }
}

export function summarizeCadDocument(document: NormalizedCadDocument) {
  const counts: Record<string, number> = {}
  for (const entity of document.entities) {
    const kind = classifyCadEntity(entity).kind
    counts[kind] = (counts[kind] ?? 0) + 1
  }
  return {
    layers: document.layers.length,
    blocks: document.blocks.length,
    textStyles: document.textStyles?.length ?? 0,
    entities: document.entities.length,
    classified: counts,
  }
}
