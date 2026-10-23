import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { basoulYvlNative as tokens } from '@basoul/yvl-adapter/native';
import { TASK_WORKFLOW_WRITES_ENABLED, taskStatusLabel, type CanonicalTaskStatus } from '../../../../packages/shared-types/src/task-status-contract';
import { TASK_REASON_COPY as copy, taskTransitionReason } from '../../../../packages/shared-types/src/task-transition-reason';

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
    try { if (!await onConfirm(validation.reason)) setError(copy.uncertain); }
    catch { setError(copy.uncertain); }
    finally { inFlight.current = false; setBusy(false); }
  }
  return <Modal visible transparent animationType="slide" onRequestClose={() => { if (!busy) onCancel(); }}>
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{flexGrow:1}}>
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: tokens.colors.background, padding: tokens.space.lg }}>
      <Text accessibilityRole="header" style={{ color: tokens.colors.text }}>{copy.title}</Text>
      <Text style={{ color: tokens.colors.text }}>{taskStatusLabel(from)} ({from}) → {taskStatusLabel(to)} ({to})</Text>
      <Text style={{ color: tokens.colors.muted }}>{copy.label}</Text>
      <TextInput accessibilityLabel={copy.label} value={reason} onChangeText={setReason} editable={!busy} multiline
        style={{ color: tokens.colors.text, borderColor: tokens.colors.border, borderWidth: 1, minHeight: 100, textAlign: 'right' }} />
      <Text style={{ color: tokens.colors.muted }}>{copy.hint} ({reason.length}/1000)</Text>
      {(!validation.valid || error) && <Text accessibilityRole="alert" style={{ color: tokens.colors.danger }}>{!validation.valid ? validation.error : error}</Text>}
      <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={onCancel}><Text style={{ color: tokens.colors.accentText }}>{copy.cancel}</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" disabled={busy || !validation.valid} onPress={() => void submit()}><Text style={{ color: tokens.colors.accentText }}>{copy.confirm}</Text></TouchableOpacity>
    </View>
    </ScrollView></KeyboardAvoidingView>
  </Modal>;
}
