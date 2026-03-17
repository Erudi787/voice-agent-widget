import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Vapi before importing the widget
vi.mock('@vapi-ai/web', () => {
  class MockVapi {
    on = vi.fn();
    start = vi.fn().mockResolvedValue(undefined);
    stop = vi.fn();
    send = vi.fn();
    removeAllListeners = vi.fn();
  }
  return { default: MockVapi };
});

import { VoiceAgentWidget } from '../src/core/widget.js';
import type { WidgetConfig } from '../src/types/index.js';

describe('VoiceAgentWidget lifecycle', () => {
  let container: HTMLElement;
  let widget: VoiceAgentWidget;

  const config: WidgetConfig = {
    publicKey: 'pk_test',
    assistantId: 'asst_test',
    position: 'bottom-right',
    theme: 'dark',
    accentColor: '#6366f1',
    mode: 'both',
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    widget = new VoiceAgentWidget(container, config);
  });

  afterEach(() => {
    widget.destroy();
    container.remove();
  });

  it('mounts a shadow DOM element into the container', () => {
    const host = container.querySelector('#vaw-root');
    expect(host).not.toBeNull();
    expect(host!.shadowRoot).not.toBeNull();
  });

  it('renders the FAB button inside shadow DOM', () => {
    const host = container.querySelector('#vaw-root')!;
    const fab = host.shadowRoot!.querySelector('.vaw-fab');
    expect(fab).not.toBeNull();
  });

  it('renders the panel (hidden by default) inside shadow DOM', () => {
    const host = container.querySelector('#vaw-root')!;
    const panel = host.shadowRoot!.querySelector('.vaw-panel');
    expect(panel).not.toBeNull();
    expect(panel!.classList.contains('vaw-panel--hidden')).toBe(true);
  });

  it('renders the chat input in "both" mode', () => {
    const host = container.querySelector('#vaw-root')!;
    const chatInput = host.shadowRoot!.querySelector('.vaw-chat-input');
    expect(chatInput).not.toBeNull();
  });

  it('does not render chat input in "voice" mode', () => {
    widget.destroy();
    container.remove();

    container = document.createElement('div');
    document.body.appendChild(container);
    widget = new VoiceAgentWidget(container, { ...config, mode: 'voice' });

    const host = container.querySelector('#vaw-root')!;
    const chatInput = host.shadowRoot!.querySelector('.vaw-chat-input');
    expect(chatInput).toBeNull();
  });

  it('emits statechange events via on()', () => {
    const listener = vi.fn();
    widget.on('statechange', listener);
    widget.start();

    // Should have transitioned through START_REQUESTED → requesting-mic
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ state: 'requesting-mic' }),
    );
  });

  it('removes event listeners via off()', () => {
    const listener = vi.fn();
    widget.on('statechange', listener);
    widget.off('statechange', listener);
    widget.start();

    expect(listener).not.toHaveBeenCalled();
  });

  it('removes the host element on destroy', () => {
    widget.destroy();
    const host = container.querySelector('#vaw-root');
    expect(host).toBeNull();
  });

  it('cleans up keyboard listener on destroy', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    widget.destroy();
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    removeSpy.mockRestore();
  });
});
