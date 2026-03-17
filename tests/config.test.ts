import { describe, it, expect, vi } from 'vitest';
import { parseConfig } from '../src/core/config.js';

describe('parseConfig', () => {
  function makeElement(attrs: Record<string, string>): Element {
    const el = document.createElement('div');
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
    return el;
  }

  it('parses public-key and assistant-id', () => {
    const config = parseConfig(makeElement({
      'public-key': 'pk_test',
      'assistant-id': 'asst_test',
    }));

    expect(config.publicKey).toBe('pk_test');
    expect(config.assistantId).toBe('asst_test');
  });

  it('parses data-* attribute variants', () => {
    const config = parseConfig(makeElement({
      'data-public-key': 'pk_data',
      'data-assistant-id': 'asst_data',
    }));

    expect(config.publicKey).toBe('pk_data');
    expect(config.assistantId).toBe('asst_data');
  });

  it('supports agent-id as alias for assistant-id', () => {
    const config = parseConfig(makeElement({
      'public-key': 'pk_test',
      'agent-id': 'agent_123',
    }));

    expect(config.assistantId).toBe('agent_123');
  });

  it('applies default values for optional fields', () => {
    const config = parseConfig(makeElement({
      'public-key': 'pk_test',
      'assistant-id': 'asst_test',
    }));

    expect(config.position).toBe('bottom-right');
    expect(config.theme).toBe('dark');
    expect(config.accentColor).toBe('#6366f1');
    expect(config.mode).toBe('both');
  });

  it('overrides defaults with explicit attributes', () => {
    const config = parseConfig(makeElement({
      'public-key': 'pk_test',
      'assistant-id': 'asst_test',
      'position': 'bottom-left',
      'theme': 'light',
      'accent-color': '#ff0000',
      'mode': 'chat',
    }));

    expect(config.position).toBe('bottom-left');
    expect(config.theme).toBe('light');
    expect(config.accentColor).toBe('#ff0000');
    expect(config.mode).toBe('chat');
  });

  it('logs error when public-key is missing', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const config = parseConfig(makeElement({
      'assistant-id': 'asst_test',
    }));

    expect(config.publicKey).toBe('');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('public-key'),
    );

    errorSpy.mockRestore();
  });

  it('logs error when assistant-id is missing', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const config = parseConfig(makeElement({
      'public-key': 'pk_test',
    }));

    expect(config.assistantId).toBe('');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('assistant-id'),
    );

    errorSpy.mockRestore();
  });
});
