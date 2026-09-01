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
  textDecoding?: { decoder: string; decodedEntities: number }
}

export type CadSemanticKind = 'wall' | 'door' | 'window' | 'room' | 'stair' | 'column' | 'dimension' | 'label' | 'item'

export interface CadClassificationRule {
  kind: CadSemanticKind
  confidence: number
  reason: string
}

export interface CadLayerDiagnostic {
  rawLayerName: string
  normalizedLayerName: string
  entityCount: number
  entityTypes: Record<string, number>
  classified: Record<CadSemanticKind, number>
  dominantKind: CadSemanticKind
  averageConfidence: number
}

const match = (value: string | null | undefined, pattern: RegExp) => pattern.test(value ?? '')
// Compatibility marker: Semantic room label from native CAD text.
const architecturalSpace = /room|bed|living|kitchen|bath|toilet|wc|hall|corridor|majlis|office|garage|store|laundry|dining|shop|elevator|shaft|غرفة|نوم|حمام|مطبخ|صالة|صالون|مجلس|ممر|محل|مكتب|مستودع|مصعد|منور|خادمة|ملابس|طعام/i
const geometryEntityTypes: CadEntityType[] = ['LINE', 'LWPOLYLINE', 'POLYLINE', 'ARC']
const isGeometry = (entity: CadEntity) => geometryEntityTypes.includes(entity.type)

const doorBlockPattern = /door|(?:^|[_-])dr(?:[_-]|$)|^dr[_-]|باب/i
const windowBlockPattern = /window|win(?:[_-]|$)|^wd[_-]|نافذ/i

const arabicDiacritics = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g

export function normalizeCadLayerName(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFKC')
    .replace(arabicDiacritics, '')
    .trim()
    .toLowerCase()
    .replace(/[\\/|:.]+/g, '-')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function layerHasToken(layer: string, aliases: readonly string[]) {
  const normalized = normalizeCadLayerName(layer)
  const tokens = new Set(normalized.split('-').filter(Boolean))
  return aliases.some((alias) => {
    const candidate = normalizeCadLayerName(alias)
    if (!candidate) return false
    if (candidate.includes('-')) return normalized === candidate || normalized.startsWith(`${candidate}-`) || normalized.endsWith(`-${candidate}`) || normalized.includes(`-${candidate}-`)
    return tokens.has(candidate)
  })
}

function layerSemanticKind(layer: string): CadSemanticKind | null {
  if (layerHasToken(layer, ['wall', 'walls', 'a-wall', 'arch-wall', 'architectural-wall', 'جدار', 'جدران', 'حوائط', 'حائط'])) return 'wall'
  if (layerHasToken(layer, ['door', 'doors', 'a-door', 'dr', 'باب', 'ابواب', 'أبواب'])) return 'door'
  if (layerHasToken(layer, ['window', 'windows', 'a-glaz', 'glaz', 'win', 'wd', 'نافذة', 'نوافذ', 'نافذ'])) return 'window'
  if (layerHasToken(layer, ['stair', 'stairs', 'stiars', 'a-stair', 'step', 'steps', 'درج', 'سلم', 'سلالم'])) return 'stair'
  if (layerHasToken(layer, ['column', 'columns', 'a-col', 'col', 'عمود', 'اعمدة', 'أعمدة'])) return 'column'
  if (layerHasToken(layer, ['room', 'rooms', 'space', 'spaces', 'area', 'zone', 'غرفة', 'غرف', 'فراغ', 'فراغات'])) return 'room'
  return null
}

export function classifyCadEntity(entity: CadEntity): CadClassificationRule {
  const rawLayer = entity.layer ?? ''
  const layer = normalizeCadLayerName(rawLayer)
  const block = normalizeCadLayerName(entity.blockName ?? '')
  const text = entity.text ?? ''
  const layerKind = layerSemanticKind(layer)

  if (entity.type === 'DIMENSION') return { kind: 'dimension', confidence: 0.99, reason: 'Native CAD DIMENSION entity.' }
  if ((entity.type === 'TEXT' || entity.type === 'MTEXT') && match(text, architecturalSpace)) return { kind: 'room', confidence: 0.9, reason: 'Semantic room label from native or decoded CAD text.' }
  if (entity.type === 'TEXT' || entity.type === 'MTEXT') return { kind: 'label', confidence: 0.92, reason: 'Native CAD text entity.' }

  if (entity.type === 'INSERT' && match(block, doorBlockPattern)) return { kind: 'door', confidence: 0.98, reason: 'Door block semantics.' }
  if (entity.type === 'INSERT' && match(block, windowBlockPattern)) return { kind: 'window', confidence: 0.98, reason: 'Window block semantics.' }
  if (entity.type === 'INSERT' && match(block, /stair|stairs|step|درج|سلم/)) return { kind: 'stair', confidence: 0.96, reason: 'Stair block semantics.' }
  if (entity.type === 'INSERT' && match(block, /column|col(?:-|$)|عمود/)) return { kind: 'column', confidence: 0.96, reason: 'Column block semantics.' }

  if (entity.type === 'INSERT' && layerKind === 'door') return { kind: 'door', confidence: 0.94, reason: 'Normalized door layer semantics.' }
  if (entity.type === 'INSERT' && layerKind === 'window') return { kind: 'window', confidence: 0.94, reason: 'Normalized window layer semantics.' }
  if (entity.type === 'INSERT' && layerKind === 'stair') return { kind: 'stair', confidence: 0.94, reason: 'Normalized stair layer semantics.' }
  if (entity.type === 'INSERT' && layerKind === 'column') return { kind: 'column', confidence: 0.94, reason: 'Normalized column layer semantics.' }

  if (isGeometry(entity) && layerKind === 'wall') return { kind: 'wall', confidence: 0.97, reason: 'Geometry is explicitly on a normalized wall layer.' }
  if (isGeometry(entity) && layerKind === 'door') return { kind: 'door', confidence: 0.88, reason: 'Native CAD geometry is explicitly on a normalized door layer.' }
  if (isGeometry(entity) && layerKind === 'window') return { kind: 'window', confidence: 0.88, reason: 'Native CAD geometry is explicitly on a normalized window layer.' }
  if (isGeometry(entity) && layerKind === 'stair') return { kind: 'stair', confidence: 0.9, reason: 'Native CAD geometry is explicitly on a normalized stair layer.' }
  if (isGeometry(entity) && layerKind === 'column') return { kind: 'column', confidence: 0.9, reason: 'Native CAD geometry is explicitly on a normalized column layer.' }

  if (['LWPOLYLINE', 'POLYLINE', 'HATCH'].includes(entity.type) && entity.closed && layerKind === 'room') return { kind: 'room', confidence: 0.9, reason: 'Closed room/space geometry on a normalized semantic layer.' }
  return { kind: 'item', confidence: 0.45, reason: `Unclassified CAD entity retained for review (layer: ${rawLayer || '0'}).` }
}

function nodeFromEntity(entity: CadEntity): ArchitectureNode | null {
  const classification = classifyCadEntity(entity)
  const common = {
    id: `cad:${entity.id}`,
    type: classification.kind,
    metadata: {
      cadEntityType: entity.type,
      layer: entity.layer,
      rawLayer: entity.layer,
      normalizedLayer: normalizeCadLayerName(entity.layer),
      blockName: entity.blockName ?? null,
      textStyle: entity.metadata?.textStyle ?? null,
      font: entity.metadata?.font ?? null,
      bigFont: entity.metadata?.bigFont ?? null,
      rawText: entity.metadata?.rawText ?? null,
      decodedText: entity.metadata?.decodedText ?? null,
      textEncoding: entity.metadata?.textEncoding ?? null,
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
        textDecoding: document.textDecoding ?? null,
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
      decodedTextCount: document.textDecoding?.decodedEntities ?? 0,
    },
  }
}

export function summarizeCadLayers(document: NormalizedCadDocument): CadLayerDiagnostic[] {
  const layers = new Map<string, CadLayerDiagnostic & { confidenceTotal: number }>()

  for (const declared of document.layers) {
    const rawLayerName = String(declared.name ?? '0')
    layers.set(rawLayerName, {
      rawLayerName,
      normalizedLayerName: normalizeCadLayerName(rawLayerName),
      entityCount: 0,
      entityTypes: {},
      classified: { wall: 0, door: 0, window: 0, room: 0, stair: 0, column: 0, dimension: 0, label: 0, item: 0 },
      dominantKind: 'item',
      averageConfidence: 0,
      confidenceTotal: 0,
    })
  }

  for (const entity of document.entities) {
    const rawLayerName = String(entity.layer || '0')
    const current = layers.get(rawLayerName) ?? {
      rawLayerName,
      normalizedLayerName: normalizeCadLayerName(rawLayerName),
      entityCount: 0,
      entityTypes: {},
      classified: { wall: 0, door: 0, window: 0, room: 0, stair: 0, column: 0, dimension: 0, label: 0, item: 0 },
      dominantKind: 'item' as CadSemanticKind,
      averageConfidence: 0,
      confidenceTotal: 0,
    }
    const classification = classifyCadEntity(entity)
    current.entityCount += 1
    current.entityTypes[entity.type] = (current.entityTypes[entity.type] ?? 0) + 1
    current.classified[classification.kind] += 1
    current.confidenceTotal += classification.confidence
    layers.set(rawLayerName, current)
  }

  return [...layers.values()].map((layer) => {
    const dominantKind = (Object.entries(layer.classified) as [CadSemanticKind, number][])
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'item'
    return {
      rawLayerName: layer.rawLayerName,
      normalizedLayerName: layer.normalizedLayerName,
      entityCount: layer.entityCount,
      entityTypes: layer.entityTypes,
      classified: layer.classified,
      dominantKind,
      averageConfidence: layer.entityCount ? layer.confidenceTotal / layer.entityCount : 0,
    }
  }).sort((a, b) => b.entityCount - a.entityCount || a.rawLayerName.localeCompare(b.rawLayerName))
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
    decodedText: document.textDecoding?.decodedEntities ?? 0,
    classified: counts,
  }
}

export * from './floor-graph'
export * from './semantic-rooms'
