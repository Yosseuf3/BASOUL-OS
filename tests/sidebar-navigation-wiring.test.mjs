import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const shell = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const architecturePage = await readFile(new URL('../app/architecture/page.tsx', import.meta.url), 'utf8');

const sidebarTargets = [
  'dashboard',
  'projects',
  'architecture',
  'tasks',
  'clients',
  'content',
  'knowledge',
  'finance',
  'activity',
  'notifications',
];

test('every visible BASOUL sidebar destination is declared and wired to navigation', () => {
  for (const target of sidebarTargets) {
    assert.match(shell, new RegExp(`\\"${target}\\"`), `${target} must be part of the shell view contract`);
    assert.match(shell, new RegExp(`navigate\\(\\"${target}\\"\\)`), `${target} must have an active navigation action`);
  }
});

test('workspace switcher keeps primary workspaces connected to real destinations', () => {
  assert.match(shell, /next === "executive"\) navigate\("dashboard"\)/);
  assert.match(shell, /next === "operations"\) navigate\("projects"\)/);
  assert.match(shell, /next === "engineering"\) navigate\("architecture"\)/);
  assert.match(shell, /next === "knowledge"\) navigate\("knowledge"\)/);
});

test('sidebar destinations have concrete view implementations', () => {
  const implementations = [
    'DashboardView',
    'ProjectsView',
    'TasksView',
    'ClientsView',
    'ContentView',
    'KnowledgeView',
    'FinanceView',
    'ActivityView',
    'NotificationsView',
  ];
  for (const implementation of implementations) {
    assert.match(shell, new RegExp(implementation), `${implementation} must be mounted by the workspace shell`);
  }
  assert.match(shell, /view === "architecture"/);
  assert.match(architecturePage, /export default function/);
});
