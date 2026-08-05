# YOSSEUF Platform

Current release candidate: **v4.0.0-rc.1 · Platform Foundation** (Preview and Staging validation only; Production remains untouched)

![Version](https://img.shields.io/badge/version-v1.1.1-d4af37)
![Status](https://img.shields.io/badge/status-stable-2ea44f)
![Node](https://img.shields.io/badge/node-22.x-43853d)
![License](https://img.shields.io/badge/license-MIT-blue)

**A unified, organization-aware business platform by YOSSEUF RADWAN.**

YOSSEUF OS unifies projects, tasks, clients, content, knowledge, finance, activity, and notifications inside one executive workspace. Its dashboard is designed to answer one practical question:

> **What should I do now?**

![YOSSEUF OS Executive Dashboard](docs/assets/screenshots/executive-dashboard-v1.0.0.png)

## Why YOSSEUF OS

Most business tools display data. YOSSEUF OS turns operational data into priorities, summaries, alerts, recommendations, and focused next actions through a dedicated Decision Layer.

## Core capabilities

- Executive Dashboard and Workspace Health 2.0
- Projects and task execution
- Client management
- Content Studio
- Knowledge base
- Finance overview
- Unified Activity Feed
- Notification Center
- Global Search and Universal Quick Create
- Keyboard-first workflows
- AI-ready shared intelligence architecture

## Architecture

```text
Presentation
    ↓
Decision Layer
    ↓
Business Logic
    ↓
Data Services / Supabase
```

Decision engines include Priority, Summary, Alerts, Recommendations, Focus, and Workspace Health. Business logic is kept outside React components to support future web and mobile clients.

## Technology

- Next.js 14
- React 18
- TypeScript 5
- Supabase
- GitHub Actions
- Vercel
- Node.js 22

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev
```

Configure these environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Open `http://localhost:3000`.

## Quality gate

```bash
npm run quality
```

The quality command runs linting, TypeScript validation, and the production build.

## Documentation

- [Installation](INSTALL.md)
- [Deployment](DEPLOYMENT.md)
- [Security](SECURITY.md)
- [Contributing](CONTRIBUTING.md)
- [Architecture](docs/WORKSPACE_ARCHITECTURE.md)
- [Product principles](docs/PRODUCT_PRINCIPLES.md)
- [AI roadmap](docs/AI_ROADMAP.md)
- [v1.1.1 hotfix release notes](RELEASE_NOTES_v1.1.1.md)
- [v1.0.0 release notes](RELEASE_NOTES_v1.0.0.md)
- [v1.1.1 hotfix test checklist](TEST_CHECKLIST_v1.1.1.md)
- [v1.0.0 test checklist](TEST_CHECKLIST_v1.0.0.md)

## Release status

**v1.1.1** is the authentication diagnostics hotfix built on the first official v1.0.0 Stable release. The stable branch should remain protected; new work should pass the Quality Gate and functional smoke tests before merging.

## Roadmap

- **v1.1:** business intelligence, CRM workflows, pipeline, and follow-up automation
- **v1.2:** embedded AI assistant, recommendations, and operational analysis
- **v1.3:** iOS and Android clients with shared business logic

## License

Released under the [MIT License](LICENSE).

---

**YOSSEUF OS** · Built by **YOSSEUF RADWAN**
