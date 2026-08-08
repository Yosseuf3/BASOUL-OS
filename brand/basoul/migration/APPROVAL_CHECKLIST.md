# BASOUL Migration Approval Checklist

This checklist records gates only; checking an item in this planning PR does not grant execution authority.

## Universal gates

- [ ] Inventory recaptured against current repository and external dashboards.
- [ ] Legal/trademark, localization, security, product, engineering, and rollback owners signed.
- [ ] Approved BASOUL asset hashes verified.
- [ ] Founder/personal-brand preservation reviewed.
- [ ] Immutable baseline and rollback artifacts captured and rehearsed.
- [ ] Staging/preview validation passed with no runtime or data behavior change.

## Explicit approvals required

- [ ] Production rebrand explicitly approved by product, engineering, security, operations, and legal owners.
- [ ] Repository rename explicitly approved by repository/governance owners.
- [ ] Domain switch explicitly approved by domain, security, SEO, Auth, and operations owners.
- [ ] Mobile bundle/package changes explicitly approved by mobile, signing, store, Auth, and product owners.
- [ ] External service rename explicitly approved by each provider/integration owner.
- [ ] Deprecation of YOSSEUF public URLs explicitly approved with traffic evidence, notice period, and rollback route.

## Stop conditions

- [ ] No database/Auth identifier mutation is included.
- [ ] No secret or key is exposed or renamed.
- [ ] No historical tag, release, deployment ID, or Git history rewrite is included.
- [ ] No YVL rule or approved BASOUL asset is altered.
- [ ] No cross-organization authorization regression exists.
- [ ] No installed-app update or login path is broken.

Any unchecked required item is a NO-GO for its corresponding phase.
