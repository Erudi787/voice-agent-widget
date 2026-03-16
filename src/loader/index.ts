import { parseConfig } from '../core/config.js';
import { VoiceAgentWidget } from '../core/widget.js';
import type { WidgetConfig, VoiceAgentWidgetAPI } from '../types/index.js';
import { DEFAULT_CONFIG } from '../types/index.js';

// ── Custom Element Registration ──

class VoiceAgentWidgetElement extends HTMLElement {
  private widget: VoiceAgentWidget | null = null;

  connectedCallback(): void {
    // Defer initialization to next frame to ensure attributes are parsed
    requestAnimationFrame(() => this.init());
  }

  disconnectedCallback(): void {
    this.widget?.destroy();
    this.widget = null;
  }

  private init(): void {
    const config = parseConfig(this);
    if (!config.publicKey || !config.assistantId) {
      console.error('[VoiceWidget] Cannot initialize: missing public-key or assistant-id');
      return;
    }
    this.widget = new VoiceAgentWidget(document.body, config);
  }
}

if (!customElements.get('voice-agent-widget')) {
  customElements.define('voice-agent-widget', VoiceAgentWidgetElement);
}

// ── Script-tag auto-init ──
// If the script tag has data-public-key and data-assistant-id, auto-mount.

function autoInit(): void {
  const script = document.currentScript as HTMLScriptElement | null;
  if (!script) return;

  const publicKey = script.getAttribute('data-public-key');
  const assistantId = script.getAttribute('data-assistant-id');

  if (!publicKey || !assistantId) return; // Not configured via script tag

  const config = parseConfig(script);
  const widget = new VoiceAgentWidget(document.body, config);

  // Expose global API
  (window as unknown as Record<string, unknown>)['VoiceAgentWidget'] = widget;
}

// ── Programmatic API ──

function createWidget(options: {
  publicKey: string;
  assistantId: string;
  position?: WidgetConfig['position'];
  theme?: WidgetConfig['theme'];
  accentColor?: string;
  mountTarget?: HTMLElement;
}): VoiceAgentWidgetAPI {
  const config: WidgetConfig = {
    publicKey: options.publicKey,
    assistantId: options.assistantId,
    position: options.position ?? DEFAULT_CONFIG.position,
    theme: options.theme ?? DEFAULT_CONFIG.theme,
    accentColor: options.accentColor ?? DEFAULT_CONFIG.accentColor,
  };

  return new VoiceAgentWidget(options.mountTarget ?? document.body, config);
}

// Expose factory on window
(window as unknown as Record<string, unknown>)['VoiceAgentWidgetSDK'] = { create: createWidget };

// Auto-init from script tag
autoInit();
