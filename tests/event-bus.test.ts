import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../src/events/event-bus.js';

describe('EventBus', () => {
  it('calls listener when event is emitted', () => {
    const bus = new EventBus();
    const listener = vi.fn();

    bus.on('test', listener);
    bus.emit('test', { value: 42 });

    expect(listener).toHaveBeenCalledWith({ value: 42 });
  });

  it('supports multiple listeners for the same event', () => {
    const bus = new EventBus();
    const a = vi.fn();
    const b = vi.fn();

    bus.on('test', a);
    bus.on('test', b);
    bus.emit('test', 'data');

    expect(a).toHaveBeenCalledWith('data');
    expect(b).toHaveBeenCalledWith('data');
  });

  it('does not call listeners for other events', () => {
    const bus = new EventBus();
    const listener = vi.fn();

    bus.on('eventA', listener);
    bus.emit('eventB', 'data');

    expect(listener).not.toHaveBeenCalled();
  });

  it('removes a listener with off()', () => {
    const bus = new EventBus();
    const listener = vi.fn();

    bus.on('test', listener);
    bus.off('test', listener);
    bus.emit('test', 'data');

    expect(listener).not.toHaveBeenCalled();
  });

  it('removes all listeners with removeAllListeners()', () => {
    const bus = new EventBus();
    const a = vi.fn();
    const b = vi.fn();

    bus.on('eventA', a);
    bus.on('eventB', b);
    bus.removeAllListeners();

    bus.emit('eventA', 'data');
    bus.emit('eventB', 'data');

    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
  });

  it('does not throw when emitting with no listeners', () => {
    const bus = new EventBus();
    expect(() => bus.emit('nonexistent', 'data')).not.toThrow();
  });

  it('catches errors in listeners without breaking other listeners', () => {
    const bus = new EventBus();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const bad = vi.fn(() => { throw new Error('oops'); });
    const good = vi.fn();

    bus.on('test', bad);
    bus.on('test', good);
    bus.emit('test', 'data');

    expect(bad).toHaveBeenCalled();
    expect(good).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('emits without data argument', () => {
    const bus = new EventBus();
    const listener = vi.fn();

    bus.on('test', listener);
    bus.emit('test');

    expect(listener).toHaveBeenCalledWith(undefined);
  });
});
