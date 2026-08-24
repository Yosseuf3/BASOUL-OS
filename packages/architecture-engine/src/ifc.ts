import type { ArchitectureScene, ArchitectureValidationResult } from './index'

export interface IfcImportDiagnostics {
  sourceBytes: number
  generatedNodes: number
  skippedItems: number
  warnings: string[]
}

export interface IfcImportResult {
  scene: ArchitectureScene
  diagnostics: IfcImportDiagnostics
  validation: ArchitectureValidationResult
}

export interface IfcConverterPort {
  convert(bytes: Uint8Array): Promise<{
    scene: ArchitectureScene
    generatedNodes?: number
    skippedItems?: number
    warnings?: string[]
  }>
}

export interface IfcImportPolicy {
  maxBytes: number
  failOnSkippedItems: boolean
}

export class BasoulIfcGateway {
  constructor(
    private readonly converter: IfcConverterPort,
    private readonly validate: (scene: ArchitectureScene) => ArchitectureValidationResult,
    private readonly policy: IfcImportPolicy = {
      maxBytes: 50 * 1024 * 1024,
      failOnSkippedItems: false,
    },
  ) {}

  async import(bytes: Uint8Array): Promise<IfcImportResult> {
    if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) {
      throw new Error('architecture.ifc.empty')
    }
    if (bytes.byteLength > this.policy.maxBytes) {
      throw new Error('architecture.ifc.too_large')
    }

    const converted = await this.converter.convert(bytes)
    const validation = this.validate(converted.scene)
    const skippedItems = converted.skippedItems ?? 0

    if (!validation.valid) {
      throw new Error('architecture.ifc.invalid_scene')
    }
    if (this.policy.failOnSkippedItems && skippedItems > 0) {
      throw new Error('architecture.ifc.incomplete_conversion')
    }

    return {
      scene: converted.scene,
      validation,
      diagnostics: {
        sourceBytes: bytes.byteLength,
        generatedNodes: converted.generatedNodes ?? Object.keys(converted.scene.nodes).length,
        skippedItems,
        warnings: converted.warnings ?? [],
      },
    }
  }
}
