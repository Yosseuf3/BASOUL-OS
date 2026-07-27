# YOSSEUF OS Platform Architecture v1.4

## Runtime surfaces

- Web: current production Next.js application.
- Installable Web App: manifest-backed standalone experience for fast mobile access.
- Native Mobile: Expo foundation under `mobile/`, isolated until React runtimes are aligned.

## Portable packages

- `@yosseuf/shared-types`: domain contracts shared across runtimes.
- `@yosseuf/decision-engine`: explainable executive decisions without UI coupling.
- `@yosseuf/event-bus`: typed platform events for future cross-module reactions.
- Existing core, services, intelligence, and UI tokens now have explicit package identities.

## Safety decision

The Expo app is not included in root npm workspaces in v1.4.0. The web app currently uses React 18 while Expo SDK 57 uses React 19.2.3. Isolating native dependencies prevents production web installs from resolving duplicate React versions. A later runtime-alignment release can add `mobile` to workspaces safely.

## Next implementation steps

1. Add mobile authentication with secure session persistence.
2. Extract project/task repositories into portable services.
3. Feed the decision engine from mobile workspace data.
4. Add push notifications and offline action queue.
5. Align React runtimes, then activate the unified workspace.
