// ── Widget Configuration ──

export interface WidgetConfig {
  publicKey: string;
  assistantId: string;
  position: 'bottom-right' | 'bottom-left';
  theme: 'light' | 'dark' | 'auto';
  accentColor: string;
}

export const DEFAULT_CONFIG: Omit<WidgetConfig, 'publicKey' | 'assistantId'> = {
  position: 'bottom-right',
  theme: 'dark',
  accentColor: '#6366f1',
};

// ── Session State Machine ──

export type SessionState =
  | 'idle'
  | 'requesting-mic'
  | 'connecting'
  | 'active'
  | 'ending'
  | 'error';

export type ActiveSubState =
  | 'user-speaking'
  | 'agent-speaking'
  | 'processing';

// ── Events ──

export type WidgetEvent =
  | { type: 'START_REQUESTED' }
  | { type: 'MIC_GRANTED' }
  | { type: 'MIC_DENIED'; error: string }
  | { type: 'CALL_STARTED' }
  | { type: 'CALL_ENDED' }
  | { type: 'STOP_REQUESTED' }
  | { type: 'SPEECH_START' }
  | { type: 'SPEECH_END' }
  | { type: 'TRANSCRIPT'; role: 'user' | 'assistant'; text: string; final: boolean }
  | { type: 'VOLUME_LEVEL'; level: number }
  | { type: 'ERROR'; message: string }
  | { type: 'UI_TOGGLE_PANEL' };

// ── Transcript Entry ──

export interface TranscriptEntry {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

// ── Public API ──

export interface VoiceAgentWidgetAPI {
  start(): void;
  stop(): void;
  destroy(): void;
  on(event: string, callback: (...args: unknown[]) => void): void;
  off(event: string, callback: (...args: unknown[]) => void): void;
}
