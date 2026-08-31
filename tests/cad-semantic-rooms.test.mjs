import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const semanticRooms = await readFile(new URL('../packages/cad-ingestion/src/semantic-rooms.ts', import.meta.url), 'utf8')
const cadIndex = await readFile(new URL('../packages/cad-ingestion/src/index.ts', import.meta.url), 'utf8')
const pascalCad = await readFile(new URL('../features/architecture/pascal-cad-scene.ts', import.meta.url), 'utf8')

test('semantic room recovery uses decoded room labels as seeds and wall runs as boundaries', () => {
  assert.match(semanticRooms, /recoverSemanticRooms/)
  assert.match(semanticRooms, /classifyCadEntity\(entity\)\.kind === 'room'/)
  assert.match(semanticRooms, /buildAxisRuns/)
  assert.match(semanticRooms, /mergeIntervals/)
  assert.match(semanticRooms, /nearestDistances/)
  assert.match(semanticRooms, /crossingTolerance/)
  assert.match(semanticRooms, /maxRay/)
  assert.match(semanticRooms, /minArea/)
  assert.match(semanticRooms, /cad-semantic-room-v2\.2/)
})

test('semantic rooms remain inside BASOUL CAD boundary and are injected before Pascal normalization', () => {
  assert.match(cadIndex, /export \* from '\.\/semantic-rooms'/)
  assert.match(pascalCad, /applySemanticRoomsToScene\(scene, document\)/)
  assert.match(pascalCad, /normalizeReconciledSceneForPascal\(semantic\.scene\)/)
  assert.doesNotMatch(semanticRooms, /@pascal-app\//)
})
