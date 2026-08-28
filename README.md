# BASOUL

Current stable baseline: **BASOUL v4.0.0**

![Version](https://img.shields.io/badge/version-v4.0.0-2563EB)
![Channel](https://img.shields.io/badge/channel-stable-16A34A)
![Node](https://img.shields.io/badge/node-22.x-43853d)
![License](https://img.shields.io/badge/license-MIT-blue)

**A unified, organization-aware business platform founded by YOSSEUF RADWAN.**

BASOUL is the technology masterbrand. YOSSEUF RADWAN remains the founder and personal identity. First-party copyright is held by **ELSHENAWY RADWAN**.

BASOUL OS unifies projects, tasks, clients, content, knowledge, finance, activity, notifications, administration, executive decision support, and an emerging Architecture workspace inside one governed platform.

> **What should I do now?**

![BASOUL OS Executive Dashboard](docs/assets/screenshots/executive-dashboard-v1.0.0.png)

## Current product status

- Product package: `basoul-platform`
- Stable product version: `v4.0.0`
- Release channel: **Stable**
- Current `main`: stable baseline plus post-release Architecture development that has passed the repository quality gate
- Architecture: BASOUL-owned scene contracts, Pascal 3D runtime, project-scoped persistence, IFC gateway, guarded AI tools, scene editing and direct 3D manipulation
- Web identity: approved BASOUL Symbol + Wordmark
- Visual palette: Navy / Electric Blue / Cyan / Violet
- Authentication: Email + Password
- RTL and responsive surfaces: enabled
- Production identifiers remain intentionally unchanged until a separately approved identifier migration

Historical Beta and Release Candidate verification records remain under `docs/releases/` as immutable release evidence.

## Core capabilities

- Executive Dashboard and Workspace Health
- Projects and task execution
- Client management
- Content Studio
- Knowledge base
- Finance overview
- Unified Activity Feed
- Notification Center
- Global Search and Universal Quick Create
- Administration and permission-aware operations
- Secure member invitations
- Keyboard-first workflows
- Shared intelligence architecture for BASOUL AI integration
- Architecture workspace with governed 3D scene editing and persistence

## Architecture

```text
YVL canonical mechanics
+ BASOUL Brand Foundation
→ BASOUL semantic adapter
→ Web / React Native primitives
→ BASOUL products
```

At the application level:

```text
Presentation
    ↓
Decision Layer
    ↓
Business Logic
    ↓
Data Services / Supabase
```

YVL governs mechanics such as spacing, radii, motion, accessibility, RTL, and interaction geometry. BASOUL Brand Foundation governs identity, approved assets, colors, and visual authority.

## Technology

- Next.js
- React
- TypeScript
- Supabase
- GitHub Actions
- Vercel
- Expo / React Native
- Pascal 3D runtime boundary
- Node.js

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev
```

Configure:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Open `http://localhost:3000`.

## Quality gate

```bash
npm run quality
```

Security and quality gates must not be weakened to make a release appear green. Known dependency advisories are tracked explicitly until a supported fix is verified.

## Documentation

- [Installation](INSTALL.md)
- [Deployment](DEPLOYMENT.md)
- [Security](SECURITY.md)
- [Contributing](CONTRIBUTING.md)
- [BASOUL Brand Foundation](brand/basoul/README.md)
- [Runtime and repository registry](docs/operations/BASOUL_RUNTIME_REGISTRY_2026-08-28.md)
- [Ecosystem Pass C](docs/architecture/BASOUL_ECOSYSTEM_PASS_C_2026-08-10.md)
- [Workspace architecture](docs/WORKSPACE_ARCHITECTURE.md)
- [Product principles](docs/PRODUCT_PRINCIPLES.md)
- [AI roadmap](docs/AI_ROADMAP.md)

Historical release notes remain in the repository as evidence and are not rewritten as current product identity.

## License

Released under the [MIT License](LICENSE).

---

**BASOUL OS** · Founded by **YOSSEUF RADWAN** · Copyright © 2026 **ELSHENAWY RADWAN**
