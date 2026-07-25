# Workspace Architecture

## App Shell

```text
AppShell
├── Sidebar
│   ├── Product identity
│   ├── Workspace Switcher
│   ├── Workspace navigation
│   └── User controls
├── Top Command Bar
│   ├── Workspace context
│   ├── Sync state
│   ├── Global search / command entry
│   └── Universal Create
├── Main Content
└── Floating Actions
```

## Workspaces

- **Executive:** health, finance, priorities, alerts and decisions.
- **Operations:** projects, tasks, clients, activity and notifications.
- **Engineering:** reserved foundation for drawings, BIM, RFIs, submittals, BOQ and site work.
- **Knowledge:** notes, references, templates and future intelligent retrieval.

## Shared packages

```text
packages/
├── core/          workspace definitions and reusable domain rules
├── services/      data and service boundaries
├── types/         cross-platform contracts
├── intelligence/  decision and workspace-health engines
└── ui-tokens/     platform-neutral design tokens
```

React components may orchestrate interactions, but domain decisions and calculations belong in shared packages.
