'use client'

import { Box, DoorOpen, Plus, Ruler, Trash2, Square } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import type { ArchitectureScene } from '../../packages/architecture-engine/src'
import {
  addOpening,
  addWall,
  editableArchitectureElements,
  firstLevelId,
  removeEditableElement,
  updateOpeningGeometry,
  updateWallGeometry,
} from './pascal-scene-editing'

export function ArchitectureEditorPanel({
  scene,
  selectedId,
  onSelectionChange,
  onSceneChange,
  text,
}: {
  scene: ArchitectureScene
  selectedId: string
  onSelectionChange: (nodeId: string) => void
  onSceneChange: (scene: ArchitectureScene, message: string) => void
  text: (ar: string, en: string) => string
}) {
  const elements = useMemo(() => editableArchitectureElements(scene), [scene])
  const selected = scene.nodes[selectedId] ?? null
  const descriptor = elements.find((element) => element.id === selectedId) ?? null

  useEffect(() => {
    if (selectedId && !scene.nodes[selectedId]) onSelectionChange('')
  }, [scene, selectedId, onSelectionChange])

  function commit(next: ArchitectureScene, message: string) {
    onSceneChange(next, message)
  }

  function addNewWall() {
    const levelId = firstLevelId(scene)
    if (!levelId) return
    const result = addWall(scene, levelId)
    onSelectionChange(result.nodeId)
    commit(result.scene, text('تمت إضافة جدار جديد إلى المشهد.', 'A new wall was added to the scene.'))
  }

  function addNewOpening(kind: 'door' | 'window') {
    const wallId = descriptor?.kind === 'wall' ? descriptor.id : typeof selected?.wallId === 'string' ? selected.wallId : null
    if (!wallId) return
    const result = addOpening(scene, wallId, kind)
    onSelectionChange(result.nodeId)
    commit(result.scene, kind === 'door' ? text('تمت إضافة باب جديد.', 'A new door was added.') : text('تمت إضافة نافذة جديدة.', 'A new window was added.'))
  }

  function removeSelected() {
    if (!descriptor) return
    const next = removeEditableElement(scene, descriptor.id)
    onSelectionChange('')
    commit(next, text('تم حذف العنصر من المشهد.', 'The element was removed from the scene.'))
  }

  return (
    <section className="bx-panel" aria-label={text('أدوات تحرير المشهد', 'Scene editing tools')}>
      <header className="bx-panel-head">
        <div>
          <span className="bx-kicker">ARCHITECTURE EDITOR · DIRECT MANIPULATION</span>
          <h3>{text('تحرير العناصر الهندسية', 'Architectural element editing')}</h3>
        </div>
        <span className="bx-chip">SELECTION · SYNCED</span>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, .8fr) minmax(280px, 1.2fr)', gap: 18 }}>
        <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
          <label style={{ display: 'grid', gap: 8 }}>
            <span className="bx-kicker">{text('العنصر المحدد', 'SELECTED ELEMENT')}</span>
            <select value={selectedId} onChange={(event) => onSelectionChange(event.target.value)} style={controlStyle}>
              <option value="">{text('اختر عنصرًا أو اضغط عليه داخل المشهد', 'Choose an element or click it in the scene')}</option>
              {elements.map((element) => <option key={element.id} value={element.id}>{element.label}</option>)}
            </select>
          </label>

          <div className="bx-actions" style={{ margin: 0, flexWrap: 'wrap' }}>
            <button type="button" onClick={addNewWall}><Box size={16} /><Plus size={14} />{text('جدار', 'Wall')}</button>
            <button type="button" onClick={() => addNewOpening('door')} disabled={!selected || (!descriptor || (descriptor.kind !== 'wall' && typeof selected.wallId !== 'string'))}><DoorOpen size={16} /><Plus size={14} />{text('باب', 'Door')}</button>
            <button type="button" onClick={() => addNewOpening('window')} disabled={!selected || (!descriptor || (descriptor.kind !== 'wall' && typeof selected.wallId !== 'string'))}><Square size={16} /><Plus size={14} />{text('نافذة', 'Window')}</button>
          </div>
        </div>

        <div>
          {!selected || !descriptor ? (
            <div className="bx-card blue"><Ruler size={20} /><h3>{text('اختر عنصرًا للبدء', 'Select an element to begin')}</h3><p>{text('اضغط مباشرة على جدار أو باب أو نافذة داخل العرض ثلاثي الأبعاد، أو اختره من القائمة.', 'Click a wall, door or window directly in the 3D view, or choose it from the list.')}</p></div>
          ) : descriptor.kind === 'wall' ? (
            <WallEditor node={selected} onChange={(patch) => commit(updateWallGeometry(scene, selected.id, patch), text('تم تحديث أبعاد الجدار.', 'Wall geometry updated.'))} text={text} />
          ) : (
            <OpeningEditor node={selected} kind={descriptor.kind} onChange={(patch) => commit(updateOpeningGeometry(scene, selected.id, patch), text('تم تحديث أبعاد الفتحة.', 'Opening geometry updated.'))} text={text} />
          )}
        </div>
      </div>

      {descriptor && <div className="bx-actions"><button type="button" onClick={removeSelected}><Trash2 size={16} />{text('حذف العنصر المحدد', 'Delete selected element')}</button></div>}
      <p>{text('التحديد متزامن الآن مع العرض ثلاثي الأبعاد. السحب المباشر يغيّر ArchitectureScene فقط ويحوّل الحالة إلى UNSAVED حتى تضغط حفظ.', 'Selection is synchronized with the 3D view. Direct dragging mutates only the BASOUL ArchitectureScene and marks it UNSAVED until you save.')}</p>
    </section>
  )
}

function WallEditor({ node, onChange, text }: { node: Record<string, unknown>; onChange: (patch: { startX?: number; startY?: number; endX?: number; endY?: number; height?: number; thickness?: number }) => void; text: (ar: string, en: string) => string }) {
  const start = Array.isArray(node.start) ? node.start : [0, 0]
  const end = Array.isArray(node.end) ? node.end : [4, 0]
  return <div className="bx-card blue"><span className="bx-kicker">WALL GEOMETRY</span><h3>{String(node.id)}</h3><div style={fieldGrid}>
    <NumberField label="Start X" value={Number(start[0] ?? 0)} onCommit={(value) => onChange({ startX: value })} />
    <NumberField label="Start Y" value={Number(start[1] ?? 0)} onCommit={(value) => onChange({ startY: value })} />
    <NumberField label="End X" value={Number(end[0] ?? 0)} onCommit={(value) => onChange({ endX: value })} />
    <NumberField label="End Y" value={Number(end[1] ?? 0)} onCommit={(value) => onChange({ endY: value })} />
    <NumberField label={text('الارتفاع', 'Height')} value={Number(node.height ?? 3.2)} min={0.1} onCommit={(value) => onChange({ height: value })} />
    <NumberField label={text('السماكة', 'Thickness')} value={Number(node.thickness ?? 0.2)} min={0.05} step={0.05} onCommit={(value) => onChange({ thickness: value })} />
  </div></div>
}

function OpeningEditor({ node, kind, onChange, text }: { node: Record<string, unknown>; kind: 'door' | 'window'; onChange: (patch: { offset?: number; sill?: number; width?: number; height?: number }) => void; text: (ar: string, en: string) => string }) {
  const position = Array.isArray(node.position) ? node.position : [0, 1, 0]
  return <div className="bx-card blue"><span className="bx-kicker">{kind.toUpperCase()} GEOMETRY</span><h3>{String(node.id)}</h3><div style={fieldGrid}>
    <NumberField label={text('الموضع على الجدار', 'Wall offset')} value={Number(position[0] ?? 0)} onCommit={(value) => onChange({ offset: value })} />
    <NumberField label={text('الارتفاع عن الأرضية', 'Vertical center')} value={Number(position[1] ?? 0)} onCommit={(value) => onChange({ sill: value })} />
    <NumberField label={text('العرض', 'Width')} value={Number(node.width ?? 1)} min={0.1} onCommit={(value) => onChange({ width: value })} />
    <NumberField label={text('الارتفاع', 'Height')} value={Number(node.height ?? 1.4)} min={0.1} onCommit={(value) => onChange({ height: value })} />
  </div></div>
}

function NumberField({ label, value, onCommit, min, step = 0.1 }: { label: string; value: number; onCommit: (value: number) => void; min?: number; step?: number }) {
  return <label style={{ display: 'grid', gap: 6 }}><span className="bx-kicker">{label}</span><input type="number" value={Number.isFinite(value) ? value : 0} min={min} step={step} onChange={(event) => onCommit(Number(event.target.value))} style={controlStyle} /></label>
}

const fieldGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 } as const
const controlStyle = { minHeight: 42, borderRadius: 12, padding: '0 12px', background: 'transparent', color: 'inherit', border: '1px solid rgba(111,168,255,.28)' } as const
