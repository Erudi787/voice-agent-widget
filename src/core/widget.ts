import type { WidgetConfig, WidgetEvent, VoiceAgentWidgetAPI } from '../types/index.js';
import { SessionStateMachine } from './state-machine.js';
import { VapiAdapter } from '../adapters/vapi-adapter.js';
import { WidgetRenderer } from '../ui/renderer.js';
import { EventBus } from '../events/event-bus.js';

export class VoiceAgentWidget implements VoiceAgentWidgetAPI {
  private config: WidgetConfig;
  private stateMachine: SessionStateMachine;
  private adapter: VapiAdapter;
  private renderer: WidgetRenderer;
  private eventBus: EventBus;

  constructor(mountTarget: HTMLElement, config: WidgetConfig) {
    this.config = config;
    this.eventBus = new EventBus();
    this.stateMachine = new SessionStateMachine();

    // Adapter: translates Vapi events → WidgetEvents → state machine
    this.adapter = new VapiAdapter(config.publicKey, (event) => this.handleEvent(event));

    // Renderer: displays UI and calls back on user actions
    this.renderer = new WidgetRenderer(mountTarget, config, {
      onStart: () => this.start(),
      onStop: () => this.stop(),
      onTogglePanel: () => this.renderer.togglePanel(),
    });

    // State changes → UI updates
    this.stateMachine.onChange((snapshot) => {
      this.renderer.update(snapshot);
      this.eventBus.emit('statechange', snapshot);
    });

    // Initial render
    this.renderer.update(this.stateMachine.snapshot);
  }

  start(): void {
    const { state } = this.stateMachine.snapshot;
    if (state !== 'idle' && state !== 'error') return;
    this.adapter.start(this.config.assistantId);
  }

  stop(): void {
    const { state } = this.stateMachine.snapshot;
    if (state !== 'active' && state !== 'connecting') return;
    this.adapter.stop();
  }

  destroy(): void {
    this.adapter.destroy();
    this.renderer.destroy();
    this.stateMachine.reset();
    this.eventBus.removeAllListeners();
  }

  on(event: string, callback: (...args: unknown[]) => void): void {
    this.eventBus.on(event, callback);
  }

  off(event: string, callback: (...args: unknown[]) => void): void {
    this.eventBus.off(event, callback);
  }

  private handleEvent(event: WidgetEvent): void {
    // Forward all events to the state machine
    this.stateMachine.send(event);

    // Handle transcript events for the renderer
    if (event.type === 'TRANSCRIPT') {
      this.renderer.addTranscript(
        {
          role: event.role,
          text: event.text,
          timestamp: Date.now(),
        },
        event.final,
      );
      this.eventBus.emit('transcript', {
        role: event.role,
        text: event.text,
        final: event.final,
      });
    }

    // Handle volume level for visualizer
    if (event.type === 'VOLUME_LEVEL') {
      this.renderer.setVolume(event.level);
    }

    // Emit lifecycle events to external listeners
    switch (event.type) {
      case 'CALL_STARTED':
        this.eventBus.emit('call-start');
        break;
      case 'CALL_ENDED':
        this.eventBus.emit('call-end');
        break;
      case 'ERROR':
        this.eventBus.emit('error', { message: event.message });
        break;
    }
  }
}
