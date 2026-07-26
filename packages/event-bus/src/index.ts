export type PlatformEventMap = {
  "project.created": { projectId: string; name: string; occurredAt: string };
  "project.updated": { projectId: string; changes: string[]; occurredAt: string };
  "task.created": { taskId: string; projectId: string; title: string; occurredAt: string };
  "task.completed": { taskId: string; projectId: string; occurredAt: string };
  "finance.updated": { transactionId: string; projectId?: string | null; occurredAt: string };
  "workspace.refresh-requested": { reason: string; occurredAt: string };
};

export type PlatformEventName = keyof PlatformEventMap;
export type PlatformEvent<TName extends PlatformEventName = PlatformEventName> = {
  id: string;
  name: TName;
  payload: PlatformEventMap[TName];
};

type EventHandler<TName extends PlatformEventName> = (event: PlatformEvent<TName>) => void | Promise<void>;

export class EventBus {
  private handlers = new Map<PlatformEventName, Set<EventHandler<any>>>();

  on<TName extends PlatformEventName>(name: TName, handler: EventHandler<TName>): () => void {
    const set = this.handlers.get(name) ?? new Set();
    set.add(handler);
    this.handlers.set(name, set);
    return () => this.off(name, handler);
  }

  off<TName extends PlatformEventName>(name: TName, handler: EventHandler<TName>): void {
    this.handlers.get(name)?.delete(handler);
  }

  async emit<TName extends PlatformEventName>(name: TName, payload: PlatformEventMap[TName]): Promise<PlatformEvent<TName>> {
    const event: PlatformEvent<TName> = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      payload,
    };
    await Promise.all(Array.from(this.handlers.get(name) ?? []).map(handler => handler(event)));
    return event;
  }
}

export const platformEventBus = new EventBus();
