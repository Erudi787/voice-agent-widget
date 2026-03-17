import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionStateMachine } from '../src/core/state-machine.js';

describe('SessionStateMachine', () => {
  let sm: SessionStateMachine;

  beforeEach(() => {
    vi.useFakeTimers();
    sm = new SessionStateMachine();
  });

  it('starts in idle state', () => {
    expect(sm.snapshot.state).toBe('idle');
    expect(sm.snapshot.error).toBeNull();
  });

  it('transitions idle → requesting-mic on START_REQUESTED', () => {
    sm.send({ type: 'START_REQUESTED' });
    expect(sm.snapshot.state).toBe('requesting-mic');
  });

  it('transitions requesting-mic → connecting on MIC_GRANTED', () => {
    sm.send({ type: 'START_REQUESTED' });
    sm.send({ type: 'MIC_GRANTED' });
    expect(sm.snapshot.state).toBe('connecting');
  });

  it('transitions connecting → active on CALL_STARTED', () => {
    sm.send({ type: 'START_REQUESTED' });
    sm.send({ type: 'MIC_GRANTED' });
    sm.send({ type: 'CALL_STARTED' });
    expect(sm.snapshot.state).toBe('active');
    expect(sm.snapshot.subState).toBe('processing');
  });

  it('transitions active → ending on STOP_REQUESTED', () => {
    sm.send({ type: 'START_REQUESTED' });
    sm.send({ type: 'MIC_GRANTED' });
    sm.send({ type: 'CALL_STARTED' });
    sm.send({ type: 'STOP_REQUESTED' });
    expect(sm.snapshot.state).toBe('ending');
  });

  it('auto-transitions ending → idle after timeout', () => {
    sm.send({ type: 'START_REQUESTED' });
    sm.send({ type: 'MIC_GRANTED' });
    sm.send({ type: 'CALL_STARTED' });
    sm.send({ type: 'STOP_REQUESTED' });
    expect(sm.snapshot.state).toBe('ending');

    vi.advanceTimersByTime(500);
    expect(sm.snapshot.state).toBe('idle');
  });

  it('transitions requesting-mic → error on MIC_DENIED', () => {
    sm.send({ type: 'START_REQUESTED' });
    sm.send({ type: 'MIC_DENIED', error: 'Permission denied' });
    expect(sm.snapshot.state).toBe('error');
    expect(sm.snapshot.error).toBe('Permission denied');
  });

  it('allows retry from error state', () => {
    sm.send({ type: 'START_REQUESTED' });
    sm.send({ type: 'MIC_DENIED', error: 'Permission denied' });
    expect(sm.snapshot.state).toBe('error');

    sm.send({ type: 'START_REQUESTED' });
    expect(sm.snapshot.state).toBe('requesting-mic');
  });

  it('times out connecting after 15s', () => {
    sm.send({ type: 'START_REQUESTED' });
    sm.send({ type: 'MIC_GRANTED' });
    expect(sm.snapshot.state).toBe('connecting');

    vi.advanceTimersByTime(15_000);
    expect(sm.snapshot.state).toBe('error');
    expect(sm.snapshot.error).toBe('Connection timed out');
  });

  it('tracks sub-states during active', () => {
    sm.send({ type: 'START_REQUESTED' });
    sm.send({ type: 'MIC_GRANTED' });
    sm.send({ type: 'CALL_STARTED' });

    sm.send({ type: 'SPEECH_START' });
    expect(sm.snapshot.subState).toBe('user-speaking');

    sm.send({ type: 'SPEECH_END' });
    expect(sm.snapshot.subState).toBe('processing');

    sm.send({ type: 'TRANSCRIPT', role: 'assistant', text: 'Hello', final: true });
    expect(sm.snapshot.subState).toBe('agent-speaking');
  });

  it('ignores invalid transitions', () => {
    sm.send({ type: 'CALL_STARTED' }); // invalid from idle
    expect(sm.snapshot.state).toBe('idle');
  });

  it('notifies listeners on state change', () => {
    const listener = vi.fn();
    sm.onChange(listener);

    sm.send({ type: 'START_REQUESTED' });
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ state: 'requesting-mic' }),
    );
  });

  it('unsubscribes listeners', () => {
    const listener = vi.fn();
    const unsub = sm.onChange(listener);

    unsub();
    sm.send({ type: 'START_REQUESTED' });
    expect(listener).not.toHaveBeenCalled();
  });

  it('resets to idle', () => {
    sm.send({ type: 'START_REQUESTED' });
    sm.send({ type: 'MIC_GRANTED' });
    sm.send({ type: 'CALL_STARTED' });
    sm.reset();
    expect(sm.snapshot.state).toBe('idle');
    expect(sm.snapshot.error).toBeNull();
  });

  it('clears error when transitioning to non-error state', () => {
    sm.send({ type: 'START_REQUESTED' });
    sm.send({ type: 'MIC_DENIED', error: 'denied' });
    expect(sm.snapshot.error).toBe('denied');

    sm.send({ type: 'START_REQUESTED' });
    expect(sm.snapshot.error).toBeNull();
  });
});
