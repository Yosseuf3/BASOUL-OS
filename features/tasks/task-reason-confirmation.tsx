import { useRef, useState } from 'react';
import { TASK_WORKFLOW_WRITES_ENABLED, taskStatusLabel, type CanonicalTaskStatus } from '../../packages/shared-types/src/task-status-contract';
import { TASK_REASON_COPY as copy, taskTransitionReason } from '../../packages/shared-types/src/task-transition-reason';

export function TaskReasonConfirmation({ from, to, onConfirm, onCancel }: {
  from: CanonicalTaskStatus; to: CanonicalTaskStatus;
  onConfirm: (reason?: string) => Promise<boolean>; onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const validation = taskTransitionReason(from, to, reason);
  if (!TASK_WORKFLOW_WRITES_ENABLED) return null;
  async function submit() {
    if (inFlight.current || !validation.valid) return;
    inFlight.current = true; setBusy(true); setError('');
    try {
      if (!await onConfirm(validation.reason)) setError(copy.uncertain);
    } catch { setError(copy.uncertain); }
    finally { inFlight.current = false; setBusy(false); }
  }
  return <section aria-label={copy.title} className="project-form">
    <h3 className="full">{copy.title}</h3>
    <p className="full">{taskStatusLabel(from)} ({from}) → {taskStatusLabel(to)} ({to})</p>
    <label className="full"><span>{copy.label}</span><textarea value={reason} disabled={busy}
      onChange={event => setReason(event.target.value)} aria-describedby="task-reason-hint" /></label>
    <p id="task-reason-hint" className="full">{copy.hint} ({reason.length}/1000)</p>
    {(!validation.valid || error) && <p role="alert" className="full">{!validation.valid ? validation.error : error}</p>}
    <button type="button" disabled={busy} onClick={onCancel}>{copy.cancel}</button>
    <button type="button" disabled={busy || !validation.valid} onClick={() => void submit()}>{copy.confirm}</button>
  </section>;
}
