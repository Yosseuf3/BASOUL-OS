# 3.0.0-beta.2 · Project Document Control

- تفعيل رفع ملفات المشروع من داخل مساحة عمل المشروع.
- إضافة مركز ملفات مستقل لكل مشروع مع حالات تحميل وفراغ وخطأ واضحة.
- دعم ملفات PDF وDWG وDXF وIFC وRevit وNavisworks وOffice والصور حتى 100MB.
- إضافة تنزيل آمن بروابط مؤقتة وحذف الملفات من الواجهة.
- إضافة جدول `project_files` وحاوية تخزين خاصة مع RLS وعزل كامل حسب المستخدم والمشروع.
- تحسين واجهة الملفات للجوال وسطح المكتب.

# 3.0.0-beta.1 · Production Readiness

- ترقية الويب إلى Next.js 16 وReact 19.
- ترقية Supabase JS وإغلاق جميع ثغرات اعتماديات الإنتاج العالية والحرجة.
- إضافة ملف قفل موثوق لتبعيات الويب وتثبيت CI باستخدام `npm ci`.
- إضافة فحص أمني لاعتماديات الإنتاج إلى بوابة الجودة.
- ترقية ESLint إلى Flat Config وتنظيف أخطاء الفحص.
- إضافة ترويسات حماية للمتصفح في بيئة الإنتاج.
- تثبيت مزامنة سجل المراجعة المكانية بين الويب وتطبيق Expo.

# 3.0.0-alpha.23 · Mobile Spatial Review

- مزامنة سجل المراجعة المكانية مع تطبيق Expo.
- عرض الملاحظات الميدانية حسب المشروع والمخطط والصفحة.
- دعم إغلاق الملاحظة أو إعادة فتحها مباشرة من الهاتف.
- تحديث بيانات مساحة العمل في الويب والموبايل من المصدر نفسه.

# 3.0.0-alpha.22 · Spatial Review Log

- Added persistent spatial review comments linked to drawing elements and pages.
- Added open, resolved, reopened, and deleted comment workflows.
- Added comment geometry snapshots so the recorded location survives later extraction changes.
- Added comment pins to the visual drawing overlay.
- Added a review composer and chronological per-drawing log.
- Added RLS ownership checks across project, drawing, element, and finding references.
- Applied the idempotent production migration successfully.
- Advanced iOS build number and Android version code to 23.

# 3.0.0-alpha.21 · Spatial Finding Links

- Added secure spatial links between review findings and plan elements.
- Added page and geometry snapshots to preserve the location used for each decision.
- Added RLS validation so findings can only link to owned elements from the same drawing.
- Findings can be linked or unlinked from the review result card.
- Linked findings appear as severity-aware pins over the drawing.
- Selecting a finding pin navigates to its full evidence and decision record.
- Advanced iOS build number and Android version code to 22.

# 3.0.0-alpha.20 · Interactive Drawing Review

- Added an in-canvas decision card for the selected plan element.
- Engineers can confirm or reject detected elements without leaving the drawing.
- Correction opens the existing human-review form with the selected element loaded.
- Added keyboard selection support and accessible decision state feedback.
- Keeps the selected marker highlighted while its decision card is open.
- Advanced iOS build number and Android version code to 21.

# 3.0.0-alpha.19 · Visual Plan Overlay

- Added an authenticated preview URL for drawings stored in Supabase.
- Added a multi-page drawing viewer with previous and next page navigation.
- Added an interactive SVG overlay for rooms, dimensions, walls, openings, and labels.
- Uses bounding boxes, line geometry, and centerlines already produced by the analysis engine.
- Added element highlighting and direct navigation from the drawing to the correction form.
- Added overlay visibility controls, a color legend, loading, error, and empty states.
- Keeps rejected elements hidden from the visual review layer.
- Advanced iOS build number and Android version code to 20.

# 3.0.0-alpha.16 · Raster PDF Vision

- Added an OpenAI-powered vision fallback for raster-heavy PDFs and uploaded plan images.
- Sends files directly from the authenticated Edge Function; the API key never reaches web or mobile clients.
- Uses strict structured output for rooms, labels, dimensions, walls, and visible openings.
- Caps automatic confidence below 80 and keeps every detected element pending engineer confirmation.
- Runs vision only when deterministic PDF extraction produces no elements.
- Limits vision fallback files to 20 MB to control latency, memory, and cost.
- Records whether vision succeeded, found no reliable elements, or failed, with explainable evidence.
- Prevents an empty analysis from being reported as a successful architectural reading.
- Mobile now reports the number of detected elements or requests a better source file.
- Advanced the analysis engine to `raster-pdf-vision-v1`.
- Advanced iOS build number and Android version code to 17.

# 3.0.0-alpha.15 · Opening Candidates

- Added conservative opening candidates derived from gaps between aligned paired-wall candidates.
- Validates wall orientation, centerline alignment, thickness similarity, and plausible gap width.
- Stores opening endpoints, width, host wall references, and average wall thickness as explainable evidence.
- Limits and deduplicates candidates to reduce false-positive noise.
- Every candidate remains unclassified until an engineer confirms whether it is a door, window, or false positive.
- Mobile review now displays opening gap coordinates and wall-thickness evidence.
- Advanced the analysis engine to `opening-candidates-v1`.
- Advanced iOS build number and Android version code to 16.

# 3.0.0-alpha.14 · Paired Wall Inference

- Added conservative pairing of parallel, overlapping PDF vector segments.
- Calculates a candidate wall centerline, thickness, orientation, and overlap ratio.
- Ranks competing pairs and prevents one vector segment from belonging to multiple wall candidates.
- Keeps unmatched axis-aligned segments as lower-confidence line candidates.
- Mobile review now displays candidate centerlines, thickness, and overlap evidence.
- Every inferred wall remains `detected` until explicitly confirmed or corrected by an engineer.
- Advanced the analysis engine to `paired-wall-inference-v1`.
- Advanced iOS build number and Android version code to 15.

# 3.0.0-alpha.13 · Vector Wall Candidates

- Added extraction of axis-aligned PDF vector line segments as reviewable wall candidates.
- Stores PDF coordinates, segment length, coordinate system, and low confidence for every candidate.
- Deduplicates identical segments and applies conservative length and alignment limits.
- Wall candidates remain `detected` until explicitly confirmed or corrected by an engineer.
- Mobile review now displays the stored start and end coordinates.
- Advanced the analysis engine to `vector-wall-candidates-v1`.
- Advanced iOS build number and Android version code to 14.

# 3.0.0-alpha.12 · Automatic Plan Extraction

- Added conservative extraction of literal text from vector PDF drawing layers.
- Automatically classifies explicit room keywords, dimensions, and general labels.
- Every extracted element is stored as `detected` with its confidence and evidence note.
- Human confirmation, correction, or rejection remains mandatory.
- Analysis responses now include the generated plan elements.
- Advanced the analysis engine to `plan-extraction-v1`.
- Advanced iOS build number and Android version code to 13.

# 3.0.0-alpha.11 · Plan Understanding Foundation

- Added persistent structured plan elements for walls, openings, rooms, labels, and dimensions.
- Added confidence, source, geometry, unit, and verification status to every plan element.
- Added a web workflow for human entry, correction, confirmation, and rejection.
- Added mobile review and confirmation of detected plan elements.
- Protected plan elements with ownership checks, RLS policies, indexes, and explicit authenticated grants.
- Advanced iOS build number and Android version code to 12.

# 3.0.0-alpha.10 · Actionable Review Decisions

- أضيفت دورة قرار كاملة للملاحظات: اعتماد، رفض، معالجة، وتحويل إلى مهمة.
- تُغلق جلسة المراجعة تلقائيًا بعد معالجة جميع الملاحظات المفتوحة والمعتمدة.
- أضيف ملخص قرار موحد في واجهتي الويب والهاتف.
- أصبح تحويل الملاحظة إلى مهمة متاحًا بعد اعتمادها صراحةً.
- أصلحت النصوص العربية المتضررة في واجهات الذكاء المعماري ومحرك التحليل.
- لا يتطلب هذا الإصدار Migration جديدة؛ الحالات مدعومة في مخطط Alpha.6.
- رُفع رقم بناء iOS وAndroid إلى 11.

# 3.0.0-alpha.9 · Architectural Analysis Pipeline

- أضيف خط تحليل معماري مشترك يعمل بعد رفع المخطط من الويب أو الهاتف.
- يتحقق المحرك من بصمة الملف الفعلية قبل معالجة PDF والصور.
- يفحص PDF لاكتشاف الصفحات والخطوط والصور وطبقات النص والمؤشرات المتجهية.
- يستخرج أبعاد PNG وJPEG ويقيّم مدى ملاءمة الدقة للمراجعة.
- يحفظ كل تشغيل للتحليل ونتائجه وأدلته ودرجة الثقة.
- ينشئ جلسة مراجعة وملاحظات تفسيرية مرتبطة بتشغيل التحليل.
- أصبح تطبيق Expo يعرض الأدلة الفنية للملاحظات.
- لا تُدمج العملات أو البيانات غير المتجانسة في نتائج مضللة.

# 3.0.0-alpha.8 ? Mobile Drawing Intake

- Added native PDF and image selection with Expo Document Picker.
- Added direct upload to the private architectural drawings bucket.
- Added project and revision selection before upload.
- Added automatic creation of an explainable review session after upload.
- Added rollback cleanup when storage or database persistence fails.
- Advanced iOS build number and Android version code to 9.

# 3.0.0-alpha.7 ? Mobile Architectural Review

- Added architectural drawings and review sessions to the Expo workspace payload.
- Added a native mobile architectural review screen.
- Added mobile conversion of explainable findings into project tasks.
- Added review and drawing shortcuts to the mobile executive dashboard.
- Advanced iOS build number and Android version code to 8.

# 3.0.0-alpha.6 ? Drawing Review Workflow

- Added persistent architectural review sessions and explainable findings.
- Added project-scoped review history with plan health and execution status.
- Added one-click conversion of architectural findings into project tasks.
- Added RLS-protected review and finding tables.
- Preserved the private drawing storage and revision workflow from alpha.5.

# 2.0.0 ? Executive Operating System

- Added the Executive Kernel orchestration layer.
- Added explainable decision signals and ranked executive actions.
- Added workspace health factors and predictive risk analysis.
- Added a dedicated mobile Command Center connected to live workspace data.
- Preserved decision logic outside React presentation components.

# Changelog

## v3.0.0-alpha.18 — Plan Element Inspector

- Added structured plan-element summaries for detected, pending, confirmed, and page-organized results.
- Added element-type and page filtering to the web architectural review.
- Added page and normalized bounding-box location details to detected elements.
- Added mobile element summaries, type filters, and page-location metadata.
- Preserved the engineer confirmation, correction, and rejection workflow.
- No database migration is required.

## v3.0.0-alpha.17 — Vision Retry Workflow

- إعادة تحليل المخطط المحفوظ دون رفع نسخة جديدة.
- تصنيف أخطاء مزود الرؤية إلى حالات قابلة للتنفيذ بدل عرض الرسالة الخام.
- توضيح حالات نفاد الرصيد، حد الطلبات، التوثيق، حجم الملف، وتعطل المزود.
- إضافة إعادة التحليل إلى الويب وتطبيق Expo.
- الحفاظ على المخطط وسجل المراجعة عند فشل مزود الرؤية.
- تحديث محرك التحليل إلى `raster-pdf-vision-v2`.

## v1.4.0.1 ? PWA Manifest Build Hotfix

- Fixed the Web App Manifest icon `purpose` value to use the valid Next.js metadata literal `maskable`.
- Restored TypeScript compatibility during the Vercel build validation stage.
- Updated the visible application version to v1.4.0.1.
- No database migration is required.

## [1.2.0.1] - 2026-07-26

### Fixed
- Fixed the production TypeScript build failure by moving `phaseLabels` to shared module scope so Project Workspace and Project Wizard can both access it.
- Updated the visible product version to v1.2.0.1.

# Changelog

## [1.2.0] - 2026-07-26

### Added
- Project Workspace ?????? ?????????.
- Executive Brief ?????? ???? ???????.
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

## 1.0.0 ? Stable

- Published the first stable production release.
- Finalized the visible application version as `v1.0.0 ? Stable`.
- Confirmed successful functional tests, GitHub Quality Gate, and Vercel production deployment.
- Added complete English and Arabic release documentation.
- Added the stable release checklist, release notes, and release audit.
- Corrected generated version and manifest inconsistencies from the preliminary stable archive.
- Preserved the historical RC security migration and audit trail.
- Standardized GitHub Actions on Node.js 22.

## 1.0.0-rc.1.1 ? Release Configuration Hotfix

- Added non-interactive ESLint configuration.
- Updated GitHub Actions to Node.js 22.
- Removed the npm cache requirement when no lock file was present.
- Updated the visible release label for release validation.

## 1.0.0-rc.1 ? Release Candidate 1

- Entered code freeze and release engineering phase.
- Removed duplicate nested project files from the archive.
- Hardened ownership RLS policies and user indexes.
- Made date-driven Decision Layer calculations deterministic.
- Added quality automation and release documentation.

## 0.9.7 ? Executive Experience
- Redesigned the executive dashboard hero for higher information density.
- Added Workspace Health 2.0 with circular progress and contextual insights.
- Upgraded KPI cards with actionable context.
- Added multi-action smart empty states.
- Improved sidebar active state and dynamic badges.
- Removed the duplicate desktop floating create button while preserving the mobile FAB.
- Added an explicit TypeScript quality-gate command.

## v0.9.6.1 ? Deployment Type Hotfix

- Fixed the production TypeScript build failure in `features/dashboard/dashboard-view.tsx`.
- Added `dashboard` to the shared `DecisionTarget` union so the Workspace Health KPI can navigate to the dashboard safely.
- No UI, database, or behavior changes beyond the type correction.


## v0.9.6 ? Workspace Architecture
- Introduced role-oriented Workspace Architecture: Executive, Operations, Engineering foundation and Knowledge.
- Added a reusable Workspace Switcher inside the App Shell.
- Added Universal Quick Create with desktop command action, mobile FAB and `N` keyboard shortcut.
- Added shared package foundations for core, services, types, intelligence and UI tokens.
- Added a calculated Workspace Health engine and dashboard KPI.
- Added strategic and architectural documentation: Vision 2030, Product Principles, Workspace Architecture and AI Roadmap.
- Added responsive and regression checklist for the final pre-RC architecture release.

## v0.9.5 ? Stability, Architecture & Final UI Polish
- Added a unified workspace loading service with graceful partial-failure handling.
- Added visible synchronization status, last-sync time, and retry action.
- Added dashboard loading skeletons and a global runtime error boundary.
- Reduced desktop sidebar width and removed the temporary roadmap card.
- Refined the top bar hierarchy and responsive dashboard density.
- Added v1 readiness architecture and iOS preparation documentation.
- No database migration required.

## v0.9.4 ? Dashboard 2.0 / Decision First Experience
- Rebuilt the dashboard around daily decisions instead of raw counters.
- Added a pure TypeScript Decision Layer under `core/intelligence`.
- Added priority scoring for tasks, projects, clients, and pending finance items.
- Added dynamic Morning Brief, Today's Focus, Critical Alerts, and smart empty states.
- Added contextual KPI cards, expanded finance snapshot, live activity, and dashboard quick actions.
- Connected quick actions directly to existing create workflows without adding database migrations.
- Added responsive layouts for desktop, tablet, and mobile.

## v0.9.3 ? Notification Center
- Added persistent notifications linked to activity events.
- Added unread state, priorities, search, filters, mark-all-read, delete, and source navigation.
- Added RLS-protected notifications migration.
- Updated activity service with centralized notification rules.


## v0.9.2 ? Unified Activity Feed
- Added persistent activity_events foundation with RLS and indexes.
- Added central Activity Service for cross-module events.
- Added unified Activity Timeline with filters and search.
- Added activity logging for create, update, delete, complete, publish, and paid actions.
- Added recent activity to the integrated dashboard.
- Prepared the shared event stream for Notification Center v0.9.3.

## v0.9.1 ? Command Center & Global Search Foundation
- Added a contextual Command Center to the dashboard.
- Added overdue, due-today, seven-day, and pending-payment indicators.
- Added global search across projects, tasks, clients, content, knowledge, and finance.
- Added Ctrl/Cmd + K keyboard shortcut and responsive search modal.
- Improved execution pulse and dashboard decision context.
- Standardized money formatting to en-US digits while preserving stored currencies.


## v0.8.0 ? Architecture Refactor + Finance Foundation

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


## v0.7.1 ? Knowledge Foundation Hotfix

- Fixed missing `KnowledgeType`, `KnowledgeItem`, and `KnowledgeInput` type imports in `app/page.tsx`.
- Restored successful TypeScript validation and production build compatibility.
- Updated the visible application version to v0.7.1.

## v0.7.0 ? Knowledge Foundation

### Added
- Personal knowledge library.
- Notes, ideas, references, and templates.
- Search by title, content, and tags.
- Type filters and favorites-only mode.
- Create, edit, favorite, and delete knowledge items.
- Supabase migration with RLS, indexes, and updated-at trigger.


## v0.4.0 ? Tasks Stable

- ????? ???? ???????? ????? ??? ???: ??????? ?????? ???????.
- ????? ???????? ??? ?????? ????????.
- ????? ?????? ??? ??? ????? ?? ????????? ?? ???????? ?? ???????.
- ?????? ?????? ???????? ???? ??????? ????????? ?????????.
- ????? ????? ????? ???? ??????.
- ?????? ??? CRUD ?RLS ?????? ?????? ?? Supabase.

## v0.3.0 ? Tasks Foundation

- ????? ?????? ?????? ????????? ?RLS.
- ????? ?????? ???? ??????.

### Final review patch
- Prevented creating a task when no project exists; the user is redirected to Projects with a clear message.
- Replaced floating `latest` dependency ranges with exact compatible versions for reproducible deployments.

## v0.5.0 ? Clients Foundation
- Added Clients CRM navigation and responsive directory.
- Added client create, edit, delete, search, and status filtering.
- Added client metrics and project counts.
- Added optional project-to-client linking through `projects.client_id`.
- Added the reviewed Supabase repair migration for the production database state.

## v0.6.0 ? Content Studio Foundation
- Added Content Studio navigation and dashboard.
- Added content CRUD, search, status and platform filters.
- Added Hook, Script, CTA, Hashtags and publishing date fields.
- Added optional project/client relationships.
- Added safe Supabase migration with RLS, indexes and updated_at trigger.

## v0.8.1 ? Finance UX Refinement
- Removed the duplicate finance create button from the toolbar.
- Added a purposeful empty state and improved zero-data metrics.
- Hidden sidebar counters when their value is zero.
- Added six-month income/expense visualization and top expense categories.
- Added recent-transactions presentation and stronger financial hierarchy.
- Prevented misleading aggregation across different currencies.
- Added responsive finance dashboard refinements.

## v0.9.0 ? Integrated Business Dashboard
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

## [1.5.0] - 2026-07-26
### Added
- Supabase mobile authentication with persisted sessions.
- Live mobile executive dashboard.
- Live projects directory and notification center.
- Mobile workspace service and modular screen architecture.
### Changed
- Product version updated to Mobile Live Foundation.

## 2.1.0 ? Executive Productivity
- Added Executive Timeline, Global Search, dashboard Quick Actions, and Workspace Health 2.0.
- Connected mobile task creation and stage advancement to Supabase.

## [2.2.0] - Cognitive & Architectural Foundation
- Added YOSSEUF Cognitive Core typed contracts and pipeline.
- Added Engineering Confidence Engine.
- Added Architectural Intelligence contracts and review report generator.
- Added persistent drawing/review/finding schema with RLS.
- Added approved architecture, principles, and roadmap documents.

## [2.2.1] - Release Consistency Hotfix
- Centralized product version and codename in `lib/config/app-info.ts`.
- Fixed stale v1.5.0 sidebar release label.
- Synchronized web, mobile, Expo, Android, and iOS release metadata.
- Added automated release consistency validation.
