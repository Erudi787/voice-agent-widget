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

    // Request microphone first (triggers browser permission prompt)
    this.onEvent({ type: 'START_REQUESTED' });

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      this.onEvent({ type: 'MIC_GRANTED' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Microphone access denied';
      this.onEvent({ type: 'MIC_DENIED', error: message });
      return;
    }

    try {
      await this.vapi.start(assistantId);
      this.active = true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start call';
      this.onEvent({ type: 'ERROR', message });
    }
  }

  stop(): void {
    if (!this.active) return;
    this.onEvent({ type: 'STOP_REQUESTED' });
    this.vapi.stop();
    this.active = false;
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
