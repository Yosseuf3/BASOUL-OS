import {execFileSync} from 'node:child_process';
import {appendFileSync, readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

// Unknown paths are cross-platform. Never infer safety from an empty diff.
export function classify(paths) {
  const scope = {web: false, mobile: false};
  if (!paths.length) return {web: true, mobile: true};
  for (const path of paths) {
    if (/^mobile\//.test(path)) scope.mobile = true;
    else if (/^(app|components|public)\//.test(path) || /^(next\.config\.|next-env\.d\.ts$|postcss\.config\.)/.test(path)) scope.web = true;
    else { scope.web = true; scope.mobile = true; }
  }
  return scope;
}

export function evaluate(platform, needs) {
  if (!['web', 'mobile'].includes(platform)) throw new Error('Unknown platform');
  if (needs.scope?.result !== 'success') throw new Error('Scope detection did not succeed');
  const affected = needs.scope.outputs?.[platform];
  if (!['true', 'false'].includes(affected)) throw new Error('Missing or invalid scope output');
  if (affected === 'true' && needs[platform]?.result !== 'success') {
    throw new Error(`${platform} is affected: mandatory quality/security job did not succeed`);
  }
  return affected === 'true' ? 'Validated affected platform' : 'Not affected; no release certification for this platform';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv[2] === 'gate') {
    console.log(evaluate(process.argv[3], JSON.parse(process.env.RELEASE_NEEDS ?? '{}')));
  } else {
    const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    const pr = process.env.GITHUB_EVENT_NAME === 'pull_request';
    const base = pr ? event.pull_request?.base?.sha : event.before;
    const head = pr ? event.pull_request?.head?.sha : event.after;
    if (![base, head].every(sha => /^[a-f0-9]{40}$/.test(sha ?? '') && !/^0+$/.test(sha))) {
      throw new Error('Missing trustworthy diff endpoints');
    }
    // No rename detection: both deleted and added paths must affect scope.
    const paths = execFileSync('git', ['diff', '--no-renames', '--name-only', '-z', pr ? `${base}...${head}` : base, ...(pr ? [] : [head]), '--'], {encoding:'utf8', maxBuffer: 16 * 1024 * 1024}).split('\0').filter(Boolean);
    const scope = classify(paths);
    appendFileSync(process.env.GITHUB_OUTPUT, `web=${scope.web}\nmobile=${scope.mobile}\n`);
    console.log(JSON.stringify({changedPaths: paths.length, ...scope}));
  }
}
