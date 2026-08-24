'use client'

import { loadPlugin } from '@pascal-app/core'
import Editor from '@pascal-app/editor'
import { builtinPlugin } from '@pascal-app/nodes'
import { useEffect, useMemo, useState } from 'react'
import { createBasoulDemoScene } from '../lib/demo-scene'

const registryReady = loadPlugin(builtinPlugin)

type SceneGraph = ReturnType<typeof createBasoulDemoScene>

const STORAGE_KEY = 'basoul:architecture:poc:scene:v1'

export default function PascalArchitectureHost() {
  const [ready, setReady] = useState(false)
  const fallbackScene = useMemo(() => createBasoulDemoScene(), [])

  useEffect(() => {
    void registryReady.then(() => setReady(true))
  }, [])

  async function loadScene(): Promise<SceneGraph | null> {
    const persisted = window.localStorage.getItem(STORAGE_KEY)
    if (!persisted) return fallbackScene
    try {
      return JSON.parse(persisted) as SceneGraph
    } catch {
      return fallbackScene
    }
  }

  async function saveScene(scene: SceneGraph) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scene))
  }

  if (!ready) {
    return (
      <main className="poc-loading">
        <strong>BASOUL Architecture PoC</strong>
        <span>Initializing Pascal registry…</span>
      </main>
    )
  }

  return (
    <main className="poc-shell">
      <header className="poc-header">
        <div>
          <strong>BASOUL Architecture</strong>
          <span>Pascal engine evaluation • isolated PoC</span>
        </div>
        <div className="poc-badge">NON-PRODUCTION</div>
      </header>
      <section className="poc-stage">
        <Editor projectId="basoul-pascal-poc" onLoad={loadScene} onSave={saveScene} layoutVersion="v2" />
      </section>
    </main>
  )
}
