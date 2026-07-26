# Changelog

## [1.2.0] - 2026-07-26

### Added
- Project Workspace متعددة التبويبات.
- Executive Brief بقواعد قرار تشغيلية.
- Architecture phase tracker.
- Project Kanban, timeline, finance summary, and activity stream.

### Changed
- Updated product version and workspace presentation to v1.2.0.


## [1.1.1] - 2026-07-26
### Added
- Four-step professional project creation wizard.
- Architectural project type and design phase fields.
- Project number, location, description, budget, currency, color and icon.
- Supabase migration and release test checklist.

### Changed
- Project workspace now exposes richer execution and commercial context.

## [1.1.0] - 2026-07-26

### Added
- Project Workspace Foundation with live operational and financial context.
- Project detail KPIs, task stream, client and delivery overview.
- Direct project edit and task creation actions.

## [1.0.1] - 2026-07-26

### Fixed
- Added a preflight health check for the Supabase Auth endpoint before requesting a magic link.
- Added timeout, offline, network-blocking, configuration, and HTTP-status diagnostics.
- Replaced generic `Failed to fetch` feedback with actionable Arabic error messages and diagnostic codes.
- Added accessible live status messaging to the login screen.

## 1.0.0 — Stable

- Published the first stable production release.
- Finalized the visible application version as `v1.0.0 · Stable`.
- Confirmed successful functional tests, GitHub Quality Gate, and Vercel production deployment.
- Added complete English and Arabic release documentation.
- Added the stable release checklist, release notes, and release audit.
- Corrected generated version and manifest inconsistencies from the preliminary stable archive.
- Preserved the historical RC security migration and audit trail.
- Standardized GitHub Actions on Node.js 22.

## 1.0.0-rc.1.1 — Release Configuration Hotfix

- Added non-interactive ESLint configuration.
- Updated GitHub Actions to Node.js 22.
- Removed the npm cache requirement when no lock file was present.
- Updated the visible release label for release validation.

## 1.0.0-rc.1 — Release Candidate 1

- Entered code freeze and release engineering phase.
- Removed duplicate nested project files from the archive.
- Hardened ownership RLS policies and user indexes.
- Made date-driven Decision Layer calculations deterministic.
- Added quality automation and release documentation.

## 0.9.7 — Executive Experience
- Redesigned the executive dashboard hero for higher information density.
- Added Workspace Health 2.0 with circular progress and contextual insights.
- Upgraded KPI cards with actionable context.
- Added multi-action smart empty states.
- Improved sidebar active state and dynamic badges.
- Removed the duplicate desktop floating create button while preserving the mobile FAB.
- Added an explicit TypeScript quality-gate command.

## v0.9.6.1 — Deployment Type Hotfix

- Fixed the production TypeScript build failure in `features/dashboard/dashboard-view.tsx`.
- Added `dashboard` to the shared `DecisionTarget` union so the Workspace Health KPI can navigate to the dashboard safely.
- No UI, database, or behavior changes beyond the type correction.


## v0.9.6 — Workspace Architecture
- Introduced role-oriented Workspace Architecture: Executive, Operations, Engineering foundation and Knowledge.
- Added a reusable Workspace Switcher inside the App Shell.
- Added Universal Quick Create with desktop command action, mobile FAB and `N` keyboard shortcut.
- Added shared package foundations for core, services, types, intelligence and UI tokens.
- Added a calculated Workspace Health engine and dashboard KPI.
- Added strategic and architectural documentation: Vision 2030, Product Principles, Workspace Architecture and AI Roadmap.
- Added responsive and regression checklist for the final pre-RC architecture release.

## v0.9.5 — Stability, Architecture & Final UI Polish
- Added a unified workspace loading service with graceful partial-failure handling.
- Added visible synchronization status, last-sync time, and retry action.
- Added dashboard loading skeletons and a global runtime error boundary.
- Reduced desktop sidebar width and removed the temporary roadmap card.
- Refined the top bar hierarchy and responsive dashboard density.
- Added v1 readiness architecture and iOS preparation documentation.
- No database migration required.

## v0.9.4 — Dashboard 2.0 / Decision First Experience
- Rebuilt the dashboard around daily decisions instead of raw counters.
- Added a pure TypeScript Decision Layer under `core/intelligence`.
- Added priority scoring for tasks, projects, clients, and pending finance items.
- Added dynamic Morning Brief, Today's Focus, Critical Alerts, and smart empty states.
- Added contextual KPI cards, expanded finance snapshot, live activity, and dashboard quick actions.
- Connected quick actions directly to existing create workflows without adding database migrations.
- Added responsive layouts for desktop, tablet, and mobile.

## v0.9.3 — Notification Center
- Added persistent notifications linked to activity events.
- Added unread state, priorities, search, filters, mark-all-read, delete, and source navigation.
- Added RLS-protected notifications migration.
- Updated activity service with centralized notification rules.


## v0.9.2 — Unified Activity Feed
- Added persistent activity_events foundation with RLS and indexes.
- Added central Activity Service for cross-module events.
- Added unified Activity Timeline with filters and search.
- Added activity logging for create, update, delete, complete, publish, and paid actions.
- Added recent activity to the integrated dashboard.
- Prepared the shared event stream for Notification Center v0.9.3.

## v0.9.1 — Command Center & Global Search Foundation
- Added a contextual Command Center to the dashboard.
- Added overdue, due-today, seven-day, and pending-payment indicators.
- Added global search across projects, tasks, clients, content, knowledge, and finance.
- Added Ctrl/Cmd + K keyboard shortcut and responsive search modal.
- Improved execution pulse and dashboard decision context.
- Standardized money formatting to en-US digits while preserving stored currencies.


## v0.8.0 — Architecture Refactor + Finance Foundation

### Architecture
- Added a shared typed Supabase repository for list/save/delete operations.
- Separated Finance into an independent feature module.
- Extended domain types without breaking existing modules.
- Preserved authentication, existing CRUD behavior, and RLS contracts.

### Finance
- Added income and expense transactions.
- Added categories, status, date, currency, notes, and optional project/client links.
- Added finance KPIs: income, expenses, net cash flow, and transaction count.
- Added search, filtering, edit, and delete flows.
- Added idempotent migration, indexes, RLS, and updated_at trigger.


## v0.7.1 — Knowledge Foundation Hotfix

- Fixed missing `KnowledgeType`, `KnowledgeItem`, and `KnowledgeInput` type imports in `app/page.tsx`.
- Restored successful TypeScript validation and production build compatibility.
- Updated the visible application version to v0.7.1.

## v0.7.0 — Knowledge Foundation

### Added
- Personal knowledge library.
- Notes, ideas, references, and templates.
- Search by title, content, and tags.
- Type filters and favorites-only mode.
- Create, edit, favorite, and delete knowledge items.
- Supabase migration with RLS, indexes, and updated-at trigger.


## v0.4.0 — Tasks Stable

- واجهة مهام احترافية بثلاث طرق عرض: بطاقات، قائمة، وكانبان.
- البحث والتصفية حسب الحالة والمشروع.
- ترتيب المهام حسب آخر تحديث أو الاستحقاق أو الأولوية أو الإنجاز.
- مؤشرات للمهام المكتملة وقيد التنفيذ والمراجعة والمتأخرة.
- تحسين تجربة تعديل وحذف المهام.
- الحفاظ على CRUD وRLS والربط الكامل مع Supabase.

## v0.3.0 — Tasks Foundation

- قاعدة بيانات المهام والعلاقات وRLS.
- إنشاء وتعديل وحذف المهام.

### Final review patch
- Prevented creating a task when no project exists; the user is redirected to Projects with a clear message.
- Replaced floating `latest` dependency ranges with exact compatible versions for reproducible deployments.

## v0.5.0 — Clients Foundation
- Added Clients CRM navigation and responsive directory.
- Added client create, edit, delete, search, and status filtering.
- Added client metrics and project counts.
- Added optional project-to-client linking through `projects.client_id`.
- Added the reviewed Supabase repair migration for the production database state.

## v0.6.0 — Content Studio Foundation
- Added Content Studio navigation and dashboard.
- Added content CRUD, search, status and platform filters.
- Added Hook, Script, CTA, Hashtags and publishing date fields.
- Added optional project/client relationships.
- Added safe Supabase migration with RLS, indexes and updated_at trigger.

## v0.8.1 — Finance UX Refinement
- Removed the duplicate finance create button from the toolbar.
- Added a purposeful empty state and improved zero-data metrics.
- Hidden sidebar counters when their value is zero.
- Added six-month income/expense visualization and top expense categories.
- Added recent-transactions presentation and stronger financial hierarchy.
- Prevented misleading aggregation across different currencies.
- Added responsive finance dashboard refinements.

## v0.9.0 — Integrated Business Dashboard
- Added a feature-isolated integrated dashboard.
- Connected project, task, client, and finance signals in one operational view.
- Added overdue attention state, upcoming tasks, finance snapshot, and recent cashflow.
- Added direct navigation from every dashboard metric and section.
- Kept finance totals currency-safe and based on paid transactions.
- Added responsive dashboard layouts and v0.9.0 regression checklist.

### Official Launch Package

- Added the production dashboard screenshot to repository documentation.
- Upgraded the English and Arabic README files for the public GitHub launch.
- Added the GitHub release body and official launch checklist.
- Added pull request, bug report, and feature request templates.
