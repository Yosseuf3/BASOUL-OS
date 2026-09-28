import type { SupabaseClient } from '@supabase/supabase-js'
import type { ArchitectureScene } from './architecture-tool'

export type SceneRecord = {
  id: string
  organization_id: string
  project_id: string
  name: string
  scene: ArchitectureScene
  updated_at?: string
}

export class SupabaseSceneAdapter {
  constructor(private readonly client: SupabaseClient) {}

  async load(organizationId: string, projectId: string): Promise<SceneRecord | null> {
    if (!organizationId || !projectId) throw new Error('scene_scope_required')
    const { data, error } = await this.client
      .from('architecture_scenes')
      .select('id, organization_id, project_id, name, scene, updated_at')
      .eq('organization_id', organizationId)
      .eq('project_id', projectId)
      .maybeSingle()
    if (error) throw error
    return data as SceneRecord | null
  }

  async save(record: SceneRecord): Promise<void> {
    if (!record.organization_id || !record.project_id) throw new Error('scene_scope_required')
    const { error } = await this.client.from('architecture_scenes').upsert(
      {
        id: record.id,
        organization_id: record.organization_id,
        project_id: record.project_id,
        name: record.name,
        scene: record.scene,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id,project_id' },
    )
    if (error) throw error
  }
}
