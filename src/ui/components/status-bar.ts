import type { SessionState, ActiveSubState } from '../../types/index.js';

const STATUS_TEXT: Record<SessionState, string> = {
  'idle': 'Ready',
  'requesting-mic': 'Requesting microphone…',
  'connecting': 'Connecting…',
  'active': 'Connected',
  'ending': 'Ending…',
  'error': 'Error',
};

const SUBSTATE_TEXT: Record<ActiveSubState, string> = {
  'user-speaking': 'Listening…',
  'agent-speaking': 'Speaking…',
  'processing': 'Thinking…',
};

export function getStatusDotClass(state: SessionState): string {
  if (state === 'active') return 'vaw-status-dot--active';
  if (state === 'connecting' || state === 'requesting-mic') return 'vaw-status-dot--connecting';
  if (state === 'error') return 'vaw-status-dot--error';
  return 'vaw-status-dot--idle';
}

export function getStatusText(state: SessionState, subState: ActiveSubState): string {
  if (state === 'active') return SUBSTATE_TEXT[subState];
  return STATUS_TEXT[state];
}
