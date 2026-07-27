import type { CognitiveEngine, CognitiveEnvelope } from "./types";

export class CognitivePipeline {
  constructor(private readonly engines: CognitiveEngine<unknown, unknown>[]) {}

  async run<TInput, TOutput>(input: CognitiveEnvelope<TInput>): Promise<CognitiveEnvelope<TOutput>> {
    let current: CognitiveEnvelope<unknown> = input;
    for (const engine of this.engines) {
      current = await engine.process(current);
      current = { ...current, trace: [...current.trace, `${engine.stage}:${engine.name}`] };
    }
    return current as CognitiveEnvelope<TOutput>;
  }
}
