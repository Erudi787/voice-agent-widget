import type { WidgetConfig, TranscriptEntry, SessionState, ActiveSubState } from '../types/index.js';
import type { SessionSnapshot } from '../core/state-machine.js';
import { createFab, updateFab } from './components/fab-button.js';
import { createPanel, type PanelElements } from './components/panel.js';
import { appendMessage, clearTranscript, updateLastMessage } from './components/transcript.js';
import { updateVisualizer, resetVisualizer } from './components/audio-visualizer.js';
import { getStatusDotClass, getStatusText } from './components/status-bar.js';
import widgetStyles from './styles/widget.css?inline';

export interface RendererCallbacks {
  onStart: () => void;
  onStop: () => void;
  onTogglePanel: () => void;
  onSendMessage?: (text: string) => void;
}

export class WidgetRenderer {
  private host: HTMLElement;
  private shadow: ShadowRoot;
  private fab: HTMLButtonElement;
  private panelEls: PanelElements;
  private config: WidgetConfig;
  private callbacks: RendererCallbacks;
  private panelOpen = false;
  private pendingPartials = new Map<string, HTMLDivElement>(); // role → last partial bubble
  private readonly keydownHandler: (e: KeyboardEvent) => void;

  constructor(mountTarget: HTMLElement, config: WidgetConfig, callbacks: RendererCallbacks) {
    this.config = config;
    this.callbacks = callbacks;

    // Create host element
    this.host = document.createElement('div');
    this.host.id = 'vaw-root';
    mountTarget.appendChild(this.host);

    // Attach shadow DOM
    this.shadow = this.host.attachShadow({ mode: 'open' });

    // Inject styles
    const style = document.createElement('style');
    style.textContent = widgetStyles;
    this.shadow.appendChild(style);

    // Create container
    const container = document.createElement('div');
    container.className = `vaw-container vaw-container--${config.position}`;

    // Create panel
    this.panelEls = createPanel(config, (text) => this.callbacks.onSendMessage?.(text));
    container.appendChild(this.panelEls.panel);

    // Create FAB
    this.fab = createFab(config.accentColor);
    container.appendChild(this.fab);

    this.shadow.appendChild(container);

    // Bind events
    this.fab.addEventListener('click', () => this.callbacks.onTogglePanel());
    this.panelEls.closeBtn.addEventListener('click', () => this.togglePanel(false));
    this.panelEls.actionBtn.addEventListener('click', () => this.handleActionClick());

    // Keyboard shortcuts (global)
    this.keydownHandler = (e: KeyboardEvent) => this.handleKeydown(e);
    document.addEventListener('keydown', this.keydownHandler);
  }

  update(snapshot: SessionSnapshot): void {
    const { state, subState, error } = snapshot;

    // Update FAB
    updateFab(this.fab, state, this.config.accentColor);

    // Update status
    this.panelEls.statusDot.className = `vaw-status-dot ${getStatusDotClass(state)}`;
    this.panelEls.statusText.textContent = getStatusText(state, subState);

    // Update action button
    this.updateActionButton(state);

    // Update visualizer visibility
    this.panelEls.visualizer.style.display = state === 'active' ? 'flex' : 'none';
    if (state !== 'active') {
      resetVisualizer(this.panelEls.visualizer);
    }

    // Show error in transcript area
    if (state === 'error' && error) {
      this.showError(error);
    }

    // Clear transcript when returning to idle
    if (state === 'idle') {
      this.pendingPartials.clear();
    }

    // Auto-open panel when connecting
    if (state === 'connecting' || state === 'requesting-mic') {
      this.togglePanel(true);
    }

    // Chat input: enable only during active call
    if (this.panelEls.chatInput) {
      const chatEnabled = state === 'active';
      this.panelEls.chatInput.input.disabled = !chatEnabled;
      this.panelEls.chatInput.sendBtn.disabled = !chatEnabled || !this.panelEls.chatInput.input.value.trim();
      this.panelEls.chatInput.input.placeholder = chatEnabled ? 'Type a message…' : 'Start a conversation first…';
    }

    // In chat-only mode, hide the voice action button and visualizer
    if (this.config.mode === 'chat') {
      this.panelEls.actionBtn.style.display = 'none';
      this.panelEls.visualizer.style.display = 'none';
    }
  }

  addTranscript(entry: TranscriptEntry, isFinal: boolean): void {
    const key = entry.role;

    if (!isFinal) {
      // Update existing partial bubble or create a new one
      const existing = this.pendingPartials.get(key);
      if (existing) {
        existing.textContent = entry.text;
        this.panelEls.transcript.scrollTop = this.panelEls.transcript.scrollHeight;
      } else {
        const bubble = appendMessage(this.panelEls.transcript, entry, this.config.accentColor);
        bubble.style.opacity = '0.7';
        this.pendingPartials.set(key, bubble);
      }
    } else {
      // Finalize: replace partial or append new
      const partial = this.pendingPartials.get(key);
      if (partial) {
        partial.textContent = entry.text;
        partial.style.opacity = '1';
        this.pendingPartials.delete(key);
      } else {
        appendMessage(this.panelEls.transcript, entry, this.config.accentColor);
      }
    }
  }

  setVolume(level: number): void {
    updateVisualizer(this.panelEls.visualizer, level);
  }

  togglePanel(open?: boolean): void {
    this.panelOpen = open ?? !this.panelOpen;
    this.panelEls.panel.classList.toggle('vaw-panel--hidden', !this.panelOpen);
  }

  destroy(): void {
    document.removeEventListener('keydown', this.keydownHandler);
    this.host.remove();
  }

  private updateActionButton(state: SessionState): void {
    const btn = this.panelEls.actionBtn;

    switch (state) {
      case 'idle':
      case 'error':
        btn.textContent = 'Start Conversation';
        btn.className = 'vaw-btn vaw-btn--start';
        btn.style.background = this.config.accentColor;
        btn.disabled = false;
        break;
      case 'requesting-mic':
      case 'connecting':
        btn.textContent = 'Connecting…';
        btn.className = 'vaw-btn vaw-btn--start';
        btn.style.background = this.config.accentColor;
        btn.disabled = true;
        break;
      case 'active':
        btn.textContent = 'End Conversation';
        btn.className = 'vaw-btn vaw-btn--stop';
        btn.style.background = '';
        btn.disabled = false;
        break;
      case 'ending':
        btn.textContent = 'Ending…';
        btn.className = 'vaw-btn vaw-btn--stop';
        btn.style.background = '';
        btn.disabled = true;
        break;
    }
  }

  private showError(message: string): void {
    const errDiv = document.createElement('div');
    errDiv.className = 'vaw-error';

    const msgEl = document.createElement('div');
    msgEl.className = 'vaw-error__message';
    msgEl.textContent = message;

    errDiv.appendChild(msgEl);
    this.panelEls.transcript.appendChild(errDiv);
    this.panelEls.transcript.scrollTop = this.panelEls.transcript.scrollHeight;
  }

  private handleActionClick(): void {
    const btn = this.panelEls.actionBtn;
    if (btn.disabled) return;

    if (btn.classList.contains('vaw-btn--stop')) {
      this.callbacks.onStop();
    } else {
      // Clear previous transcript for new session
      clearTranscript(this.panelEls.transcript);
      this.callbacks.onStart();
    }
  }

  private handleKeydown(e: KeyboardEvent): void {
    // Don't capture when user is typing in an input/textarea outside the widget
    const target = e.target as HTMLElement;
    const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    // Escape — close panel
    if (e.key === 'Escape' && this.panelOpen) {
      e.preventDefault();
      this.togglePanel(false);
      this.fab.focus();
      return;
    }

    // Don't intercept shortcuts when user is typing in a form field
    if (isTyping) return;

    // Ctrl/Cmd + Shift + V — toggle panel
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
      e.preventDefault();
      this.callbacks.onTogglePanel();
    }
  }
}
