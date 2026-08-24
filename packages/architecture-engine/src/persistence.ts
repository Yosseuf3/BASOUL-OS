import type { ArchitectureScene } from './index'

export interface ArchitectureSceneRecord {
  id: string
  organizationId: string
  projectId: string
  userId: string
  name: string
  scene: ArchitectureScene
  createdAt: string
  updatedAt: string
}

export interface ArchitectureSceneScope {
  organizationId: string
  projectId: string
}

export interface ArchitectureSceneRepository {
  load(scope: ArchitectureSceneScope): Promise<ArchitectureSceneRecord | null>
  save(scope: ArchitectureSceneScope, scene: ArchitectureScene, name?: string): Promise<ArchitectureSceneRecord>
  remove(scope: ArchitectureSceneScope): Promise<void>
}

interface ArchitectureSceneRow {
  id: string
  organization_id: string
  project_id: string
  user_id: string
  name: string
  scene: ArchitectureScene
  created_at: string
  updated_at: string
}

interface QueryResult<T> {
  data: T
  error: unknown | null
}

interface FilterBuilder<T> extends PromiseLike<QueryResult<T>> {
  eq(column: string, value: string): FilterBuilder<T>
  select(columns?: string): FilterBuilder<T>
  maybeSingle(): PromiseLike<QueryResult<ArchitectureSceneRow | null>>
  single(): PromiseLike<QueryResult<ArchitectureSceneRow>>
}

interface SupabaseTableLike {
  select(columns?: string): FilterBuilder<ArchitectureSceneRow[]>
  upsert(values: unknown, options?: { onConflict?: string }): FilterBuilder<ArchitectureSceneRow[]>
  delete(): FilterBuilder<null>
}

export interface SupabaseQueryLike {
  from(table: string): SupabaseTableLike
}

function assertScope(scope: ArchitectureSceneScope): void {
  if (!scope.organizationId?.trim()) throw new Error('architecture.scope.organization_required')
  if (!scope.projectId?.trim()) throw new Error('architecture.scope.project_required')
}

export class SupabaseArchitectureSceneRepository implements ArchitectureSceneRepository {
  constructor(private readonly client: SupabaseQueryLike) {}

  async load(scope: ArchitectureSceneScope): Promise<ArchitectureSceneRecord | null> {
    assertScope(scope)
    const { data, error } = await this.client
      .from('architecture_scenes')
      .select('*')
      .eq('organization_id', scope.organizationId)
      .eq('project_id', scope.projectId)
      .maybeSingle()

    if (error) throw error
    return data ? mapRecord(data) : null
  }

  async save(scope: ArchitectureSceneScope, scene: ArchitectureScene, name = 'Architecture scene'): Promise<ArchitectureSceneRecord> {
    assertScope(scope)
    const { data, error } = await this.client
      .from('architecture_scenes')
      .upsert(
        {
          organization_id: scope.organizationId,
          project_id: scope.projectId,
          name,
          scene,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id,project_id' },
      )
      .select('*')
      .single()

    if (error) throw error
    return mapRecord(data)
  }

  async remove(scope: ArchitectureSceneScope): Promise<void> {
    assertScope(scope)
    const { error } = await this.client
      .from('architecture_scenes')
      .delete()
      .eq('organization_id', scope.organizationId)
      .eq('project_id', scope.projectId)

    if (error) throw error
  }
}

function mapRecord(row: ArchitectureSceneRow): ArchitectureSceneRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    projectId: row.project_id,
    userId: row.user_id,
    name: row.name,
    scene: row.scene,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
