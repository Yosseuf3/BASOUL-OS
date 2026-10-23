/** Identity + selection generation, never an authorization credential. */
export type OrganizationLease = {
  userId: string;
  organizationId: string;
  revision: number;
  isCurrent: () => boolean;
};
export class OrganizationChangedError extends Error {
  readonly code = 'ORGANIZATION_CHANGED';
  constructor() { super('تغيرت المؤسسة أو الجلسة. أعد فتح العملية. / Organization or session changed. Reopen the operation.'); }
}
export class OrganizationScopeError extends Error {
  constructor(readonly code:'ORGANIZATION_ACCESS_DENIED'|'ORGANIZATION_RECORD_UNAVAILABLE') {
    super((code==='ORGANIZATION_ACCESS_DENIED'
      ?'تعذر التحقق من صلاحية العملية في المؤسسة. أعد التحقق. / Organization permission denied. Verify your membership.'
      :'السجل غير متاح في المؤسسة المحددة. / Record unavailable in the selected organization.')+` (${code})`);
  }
}
export function assertOrganizationLease(lease: Pick<OrganizationLease, 'isCurrent'>) {
  if (!lease.isCurrent()) throw new OrganizationChangedError();
}
export async function inOrganization<T>(lease:OrganizationLease,operation:()=>T|PromiseLike<T>):Promise<T> {
  assertOrganizationLease(lease);const result=await operation();assertOrganizationLease(lease);return result;
}
