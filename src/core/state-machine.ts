import type { SessionState, ActiveSubState, WidgetEvent } from '../types/index.js';

export interface SessionSnapshot {
  state: SessionState;
  subState: ActiveSubState;
  error: string | null;
}

type StateChangeCallback = (snapshot: SessionSnapshot) => void;

// Valid transitions: [currentState] → event → nextState
const TRANSITIONS: Record<SessionState, Partial<Record<WidgetEvent['type'], SessionState>>> = {
  'idle': {
    'START_REQUESTED': 'requesting-mic',
  },
  'requesting-mic': {
    'MIC_GRANTED': 'connecting',
    'MIC_DENIED': 'error',
    'ERROR': 'error',
  },
  'connecting': {
    'CALL_STARTED': 'active',
    'ERROR': 'error',
    'STOP_REQUESTED': 'ending',
  },
  'active': {
    'STOP_REQUESTED': 'ending',
    'CALL_ENDED': 'ending',
    'ERROR': 'error',
  },
  'ending': {
    'CALL_ENDED': 'idle',
    // If already ending and call-end fires, go to idle
    'ERROR': 'idle',
  },
  'error': {
    'START_REQUESTED': 'requesting-mic',
    // Allow retry from error state
  },
};

const CONNECT_TIMEOUT_MS = 15_000;

export class SessionStateMachine {
  private _state: SessionState = 'idle';
  private _subState: ActiveSubState = 'processing';
  private _error: string | null = null;
  private _listeners = new Set<StateChangeCallback>();
  private _connectTimer: ReturnType<typeof setTimeout> | null = null;
  private _endingTimer: ReturnType<typeof setTimeout> | null = null;

  get snapshot(): SessionSnapshot {
    return {
      state: this._state,
      subState: this._subState,
      error: this._error,
    };
  }

  onChange(callback: StateChangeCallback): () => void {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  send(event: WidgetEvent): void {
    const nextState = TRANSITIONS[this._state]?.[event.type];

    // Handle sub-state updates within 'active' without a full transition
    if (this._state === 'active') {
      if (event.type === 'SPEECH_START') {
        this._subState = 'user-speaking';
        this.notify();
        return;
      }
      if (event.type === 'SPEECH_END') {
        this._subState = 'processing';
        this.notify();
        return;
      }
      if (event.type === 'TRANSCRIPT' && event.role === 'assistant') {
        this._subState = 'agent-speaking';
        this.notify();
        return;
      }
    }

    if (!nextState) {
      console.warn(`[VoiceWidget] No transition: ${this._state} + ${event.type}`);
      return;
    }

    this._state = nextState;

    // Reset sub-state when entering active
    if (nextState === 'active') {
      this._subState = 'processing';
    }

    // Track errors
    if (event.type === 'ERROR') {
      this._error = (event as { type: 'ERROR'; message: string }).message;
    } else if (event.type === 'MIC_DENIED') {
      this._error = (event as { type: 'MIC_DENIED'; error: string }).error;
    } else if (nextState !== 'error') {
      this._error = null;
    }

    // Connection timeout management
    if (nextState === 'connecting') {
      this.startConnectTimeout();
    } else {
      this.clearConnectTimeout();
    }

    // Auto-transition: ending → idle after cleanup delay
    if (nextState === 'ending') {
      this.startEndingTimeout();
    } else {
      this.clearEndingTimeout();
    }

    this.notify();
  }

  reset(): void {
    this.clearConnectTimeout();
    this.clearEndingTimeout();
    this._state = 'idle';
    this._subState = 'processing';
    this._error = null;
    this.notify();
  }

  private notify(): void {
    const snap = this.snapshot;
    this._listeners.forEach((cb) => {
      try {
        cb(snap);
      } catch (err) {
        console.error('[VoiceWidget] State listener error:', err);
      }
    });
  }

  private startConnectTimeout(): void {
    this.clearConnectTimeout();
    this._connectTimer = setTimeout(() => {
      if (this._state === 'connecting') {
        this.send({ type: 'ERROR', message: 'Connection timed out' });
      }
    }, CONNECT_TIMEOUT_MS);
  }

  private clearConnectTimeout(): void {
    if (this._connectTimer) {
      clearTimeout(this._connectTimer);
      this._connectTimer = null;
    }
  }

  private startEndingTimeout(): void {
    this.clearEndingTimeout();
    this._endingTimer = setTimeout(() => {
      if (this._state === 'ending') {
        this._state = 'idle';
        this._error = null;
        this.notify();
      }
    }, 500);
  }

  private clearEndingTimeout(): void {
    if (this._endingTimer) {
      clearTimeout(this._endingTimer);
      this._endingTimer = null;
    }
  }
}
