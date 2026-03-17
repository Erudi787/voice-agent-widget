import type { WidgetConfig } from '../types/index.js';
import { DEFAULT_CONFIG } from '../types/index.js';

/**
 * Parse config from a <voice-agent-widget> element's attributes
 * or from data-* attributes on a <script> tag.
 */
export function parseConfig(el: Element): WidgetConfig {
  const publicKey = attr(el, 'public-key') ?? attr(el, 'data-public-key') ?? '';
  const assistantId = attr(el, 'assistant-id') ?? attr(el, 'agent-id') ?? attr(el, 'data-assistant-id') ?? '';

  if (!publicKey) {
    console.error('[VoiceWidget] Missing required attribute: public-key');
  }
  if (!assistantId) {
    console.error('[VoiceWidget] Missing required attribute: assistant-id');
  }

  return {
    publicKey,
    assistantId,
    position: (attr(el, 'position') ?? attr(el, 'data-position') ?? DEFAULT_CONFIG.position) as WidgetConfig['position'],
    theme: (attr(el, 'theme') ?? attr(el, 'data-theme') ?? DEFAULT_CONFIG.theme) as WidgetConfig['theme'],
    accentColor: attr(el, 'accent-color') ?? attr(el, 'data-accent-color') ?? DEFAULT_CONFIG.accentColor,
    mode: (attr(el, 'mode') ?? attr(el, 'data-mode') ?? DEFAULT_CONFIG.mode) as WidgetConfig['mode'],
  };
}

function attr(el: Element, name: string): string | null {
  return el.getAttribute(name);
}
