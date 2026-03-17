import Vapi from '@vapi-ai/web';
import type { WidgetEvent } from '../types/index.js';

type EventCallback = (event: WidgetEvent) => void;

export class VapiAdapter {
  private vapi: Vapi;
  private onEvent: EventCallback;
  private active = false;

  constructor(publicKey: string, onEvent: EventCallback) {
    this.vapi = new Vapi(publicKey);
    this.onEvent = onEvent;
    this.bindEvents();
  }

  async start(assistantId: string): Promise<void> {
    if (this.active) return;

    this.onEvent({ type: 'START_REQUESTED' });

    // Check mic permission state without triggering a prompt, so we can
    // update the UI before Vapi's own getUserMedia fires the browser dialog.
    try {
      const permStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (permStatus.state === 'denied') {
        this.onEvent({ type: 'MIC_DENIED', error: 'Microphone access was previously denied. Please allow it in browser settings.' });
        return;
      }
    } catch {
      // permissions.query not supported in all browsers — proceed anyway
    }

    this.onEvent({ type: 'MIC_GRANTED' });

    try {
      await this.vapi.start(assistantId);
      this.active = true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start call';
      // Distinguish mic denial from other errors
      if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('notallowed')) {
        this.onEvent({ type: 'MIC_DENIED', error: message });
      } else {
        this.onEvent({ type: 'ERROR', message });
      }
    }
  }

  stop(): void {
    if (!this.active) return;
    this.onEvent({ type: 'STOP_REQUESTED' });
    this.vapi.stop();
    this.active = false;
  }

  sendMessage(text: string): void {
    if (!this.active) return;
    this.vapi.send({
      type: 'add-message',
      message: {
        role: 'user',
        content: text,
      },
    });
  }

  destroy(): void {
    this.stop();
    this.vapi.removeAllListeners();
  }

  private bindEvents(): void {
    this.vapi.on('call-start', () => {
      this.onEvent({ type: 'CALL_STARTED' });
    });

    this.vapi.on('call-end', () => {
      this.active = false;
      this.onEvent({ type: 'CALL_ENDED' });
    });

    this.vapi.on('speech-start', () => {
      this.onEvent({ type: 'SPEECH_START' });
    });

    this.vapi.on('speech-end', () => {
      this.onEvent({ type: 'SPEECH_END' });
    });

    this.vapi.on('volume-level', (level: number) => {
      this.onEvent({ type: 'VOLUME_LEVEL', level });
    });

    this.vapi.on('message', (msg: Record<string, unknown>) => {
      if (msg.type === 'transcript') {
        this.onEvent({
          type: 'TRANSCRIPT',
          role: msg.role as 'user' | 'assistant',
          text: msg.transcript as string,
          final: msg.transcriptType === 'final',
        });
      }
    });

    this.vapi.on('error', (err: Record<string, unknown>) => {
      const message = (err?.message as string) ?? (err?.error as string) ?? 'Unknown error';
      this.onEvent({ type: 'ERROR', message });
    });
  }
}
