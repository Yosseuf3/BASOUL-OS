'use client'

import { supabase } from '@/lib/supabase'
import type { ArchitectureScene } from '../../packages/architecture-engine/src/index'

export type ArchitectureProject = {
  id: string
  name: string
  status?: string | null
  updated_at?: string | null
}

export type ArchitectureScenePayload = {
  id: string
  project_id: string
  organization_id: string
  user_id: string
  name: string
  scene: ArchitectureScene
  created_at: string
  updated_at: string
}

type ApiEnvelope<T> = {
  data?: T
  error?: string
}

async function authenticatedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  const token = data.session?.access_token
  if (!token) throw new Error('architecture.auth.required')

  const headers = new Headers(init?.headers)
  headers.set('Authorization', `Bearer ${token}`)
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  return fetch(input, { ...init, headers, cache: 'no-store' })
}

async function readEnvelope<T>(response: Response): Promise<T> {
  const body = await response.json() as ApiEnvelope<T>
  if (!response.ok) throw new Error(body.error || `architecture.request.failed.${response.status}`)
  return body.data as T
}

export async function loadArchitectureProjects(): Promise<ArchitectureProject[]> {
  const response = await authenticatedFetch('/api/workspace/projects')
  return readEnvelope<ArchitectureProject[]>(response)
}

export async function loadArchitectureScene(projectId: string): Promise<ArchitectureScenePayload | null> {
  const response = await authenticatedFetch(`/api/architecture/scene?projectId=${encodeURIComponent(projectId)}`)
  return readEnvelope<ArchitectureScenePayload | null>(response)
}

export async function saveArchitectureScene(input: {
  projectId: string
  name: string
  scene: ArchitectureScene
}): Promise<ArchitectureScenePayload> {
  const response = await authenticatedFetch('/api/architecture/scene', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
  return readEnvelope<ArchitectureScenePayload>(response)
}
