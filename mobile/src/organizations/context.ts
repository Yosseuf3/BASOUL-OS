import type { MobileOrganizationRole } from "../permissions/organization";

export type OrganizationContext = { userId: string; organizationId: string; name: string; role: MobileOrganizationRole };
export type OrganizationSnapshot = { userId: string | null; memberships: OrganizationContext[]; selected: OrganizationContext | null; revision: number };
type SelectionStorage = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void>; removeItem(key: string): Promise<void> };

// Persist only a user-scoped organization ID, never credentials or a trusted role.
export class OrganizationContextStore {
  private revision = 0;
  private userId: string | null = null;
  private selected: OrganizationContext | null = null;
  private storageQueue: Promise<unknown> = Promise.resolve();
  constructor(private storage: SelectionStorage, private load: (userId: string) => Promise<OrganizationContext[]>) {}
  private key(userId: string) { return `basoul:organization:${userId}`; }
  private persist(userId: string, id: string | null) {
    const operation = this.storageQueue.catch(() => undefined).then(() => id === null
      ? this.storage.removeItem(this.key(userId)) : this.storage.setItem(this.key(userId), id));
    this.storageQueue = operation;
    return operation;
  }
  clear() {
    const previousUser = this.userId;
    this.revision++; this.userId = null; this.selected = null;
    if (previousUser) void this.persist(previousUser, null).catch(() => undefined);
  }
  isCurrent(revision: number) { return revision === this.revision; }
  invalidate() { this.revision++; this.selected = null; }
  get currentRevision() { return this.revision; }
  async refresh(userId: string, requestedId?: string): Promise<OrganizationSnapshot | null> {
    if (this.userId && this.userId !== userId) this.clear();
    this.userId = userId;
    const remembered = this.selected?.organizationId;
    this.selected = null;
    const revision = ++this.revision;
    await this.storageQueue.catch(() => undefined);
    const persisted = await this.storage.getItem(this.key(userId)).catch(() => null);
    const memberships = await this.load(userId);
    if (!this.isCurrent(revision)) return null;
    if (memberships.some((membership) => membership.userId !== userId)) throw new Error("Organization account mismatch");
    const candidate = requestedId ?? remembered ?? persisted;
    const selected = memberships.find((membership) => membership.organizationId === candidate)
      ?? (memberships.length === 1 ? memberships[0] : null);
    if (requestedId && selected?.organizationId !== requestedId) throw new Error("Organization membership is no longer active");
    this.selected = selected;
    await this.persist(userId, selected?.organizationId ?? null).catch(() => undefined);
    if (!this.isCurrent(revision)) return null;
    return { userId, memberships, selected, revision };
  }
}
