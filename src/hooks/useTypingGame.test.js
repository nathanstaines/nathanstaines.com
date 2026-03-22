import { renderHook, act } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { MESSAGE } from '../constants';
import useTypingGame from './useTypingGame';

beforeEach(() => {
  vi.clearAllMocks();
});

// Helper: simulate typing a single key via handleKeyDown
function pressKey(result, key, opts = {}) {
  act(() => {
    result.current.handleKeyDown({
      key,
      ctrlKey: false,
      metaKey: false,
      preventDefault: () => {},
      ...opts,
    });
  });
}

// Helper: type a full string character by character
function typeString(result, str) {
  for (const ch of str) {
    pressKey(result, ch);
  }
}

// ── Idle baseline ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  test('returns idle baseline with no input', () => {
    const { result } = renderHook(() => useTypingGame());
    const { state } = result.current;

    expect(state.typed).toBe('');
    expect(state.message).toBe(MESSAGE);
    expect(state.started).toBe(false);
    expect(state.finished).toBe(false);
    expect(state.elapsed).toBe(0);
    expect(state.wpm).toBeNull();
    expect(state.accuracy).toBeNull();
    expect(state.errors).toBe(0);
    expect(state.progress).toBe(0);
  });

  test('exposes required actions', () => {
    const { result } = renderHook(() => useTypingGame());

    expect(typeof result.current.handleKeyDown).toBe('function');
    expect(typeof result.current.reset).toBe('function');
    expect(typeof result.current.focus).toBe('function');
    expect(result.current.inputRef).toBeDefined();
  });
});

// ── State transitions ─────────────────────────────────────────────────────────

describe('state transitions', () => {
  test('starts on first valid character', () => {
    const { result } = renderHook(() => useTypingGame());

    pressKey(result, 'I');

    expect(result.current.state.started).toBe(true);
    expect(result.current.state.typed).toBe('I');
    expect(result.current.state.finished).toBe(false);
  });

  test('does not start on Backspace when nothing typed', () => {
    const { result } = renderHook(() => useTypingGame());

    pressKey(result, 'Backspace');

    expect(result.current.state.started).toBe(false);
    expect(result.current.state.typed).toBe('');
  });

  test('ignores Tab key (handled externally for reset)', () => {
    const { result } = renderHook(() => useTypingGame());

    pressKey(result, 'Tab');

    expect(result.current.state.started).toBe(false);
  });

  test('ignores modifier combos (Ctrl+key)', () => {
    const { result } = renderHook(() => useTypingGame());

    pressKey(result, 'a', { ctrlKey: true });

    expect(result.current.state.started).toBe(false);
    expect(result.current.state.typed).toBe('');
  });

  test('handles backspace: removes last character', () => {
    const { result } = renderHook(() => useTypingGame());

    pressKey(result, 'I');
    pressKey(result, ' ');
    pressKey(result, 'Backspace');

    expect(result.current.state.typed).toBe('I');
  });

  test('does not exceed message length', () => {
    const { result } = renderHook(() => useTypingGame());

    // Fill message fully then try to add more
    typeString(result, MESSAGE);
    pressKey(result, 'x');

    expect(result.current.state.typed.length).toBe(MESSAGE.length);
  });

  test('does not accept input after finished', () => {
    const { result } = renderHook(() => useTypingGame());

    typeString(result, MESSAGE);
    expect(result.current.state.finished).toBe(true);

    pressKey(result, 'x');
    expect(result.current.state.typed.length).toBe(MESSAGE.length);
  });
});

// ── Elapsed / metrics with injected timeProvider ──────────────────────────────

describe('elapsed and metrics with injected timeProvider', () => {
  test('computes elapsed deterministically', () => {
    let fakeNow = 0;
    const timeProvider = () => fakeNow;

    const { result } = renderHook(() => useTypingGame({ timeProvider }));

    // Start game at t=0
    fakeNow = 0;
    pressKey(result, 'I');

    // Advance 30 seconds then complete game
    fakeNow = 30_000;
    typeString(result, MESSAGE.slice(1)); // type rest of message

    expect(result.current.state.finished).toBe(true);
    expect(result.current.state.elapsed).toBeCloseTo(30, 0);
  });

  test('computes WPM deterministically at completion', () => {
    let fakeNow = 0;
    const timeProvider = () => fakeNow;

    const { result } = renderHook(() => useTypingGame({ timeProvider }));

    fakeNow = 0;
    pressKey(result, MESSAGE[0]);

    fakeNow = 60_000; // 60 seconds elapsed
    typeString(result, MESSAGE.slice(1));

    expect(result.current.state.finished).toBe(true);
    // expected WPM = round(MESSAGE.length / 5 / 60 * 60) = round(MESSAGE.length / 5)
    const expectedWpm = Math.round(MESSAGE.length / 5);
    expect(result.current.state.wpm).toBe(expectedWpm);
  });

  test('computes accuracy correctly for perfect typing', () => {
    const { result } = renderHook(() => useTypingGame());

    typeString(result, MESSAGE);

    expect(result.current.state.accuracy).toBe(100);
    expect(result.current.state.errors).toBe(0);
  });

  test('computes accuracy and errors for imperfect typing', () => {
    const { result } = renderHook(() => useTypingGame());

    // Type first char wrong, rest correct
    pressKey(result, 'X'); // wrong
    typeString(result, MESSAGE.slice(1)); // rest correct

    // errors = 1, accuracy = round((MESSAGE.length - 1) / MESSAGE.length * 100)
    expect(result.current.state.errors).toBe(1);
    const expectedAccuracy = Math.round(
      ((MESSAGE.length - 1) / MESSAGE.length) * 100,
    );
    expect(result.current.state.accuracy).toBe(expectedAccuracy);
  });
});

// ── Completion event ──────────────────────────────────────────────────────────

describe('completion event', () => {
  test('emits completed event exactly once when game finishes', () => {
    const onEvent = vi.fn();
    let fakeNow = 0;
    const timeProvider = () => fakeNow;

    const { result } = renderHook(() =>
      useTypingGame({ onEvent, timeProvider }),
    );

    fakeNow = 0;
    pressKey(result, MESSAGE[0]);

    fakeNow = 30_000;
    typeString(result, MESSAGE.slice(1));

    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenCalledWith({
      type: 'completed',
      payload: expect.objectContaining({
        wpm: expect.any(Number),
        accuracy: expect.any(Number),
        errors: expect.any(Number),
        elapsed: expect.any(Number),
      }),
    });
  });

  test('does not emit event before completion', () => {
    const onEvent = vi.fn();
    const { result } = renderHook(() => useTypingGame({ onEvent }));

    typeString(result, MESSAGE.slice(0, 5));

    expect(onEvent).not.toHaveBeenCalled();
  });

  test('completion payload contains correct elapsed value', () => {
    const onEvent = vi.fn();
    let fakeNow = 0;
    const timeProvider = () => fakeNow;

    const { result } = renderHook(() =>
      useTypingGame({ onEvent, timeProvider }),
    );

    fakeNow = 0;
    pressKey(result, MESSAGE[0]);

    fakeNow = 45_000;
    typeString(result, MESSAGE.slice(1));

    const payload = onEvent.mock.calls[0][0].payload;
    expect(payload.elapsed).toBeCloseTo(45, 0);
  });
});

// ── Reset ─────────────────────────────────────────────────────────────────────

describe('reset', () => {
  test('returns to idle baseline after reset', () => {
    const { result } = renderHook(() => useTypingGame());

    typeString(result, MESSAGE.slice(0, 10));
    expect(result.current.state.started).toBe(true);

    act(() => {
      result.current.reset();
    });

    const { state } = result.current;
    expect(state.typed).toBe('');
    expect(state.started).toBe(false);
    expect(state.finished).toBe(false);
    expect(state.elapsed).toBe(0);
    expect(state.wpm).toBeNull();
    expect(state.accuracy).toBeNull();
    expect(state.errors).toBe(0);
    expect(state.progress).toBe(0);
  });

  test('can start a new game after reset', () => {
    const { result } = renderHook(() => useTypingGame());

    typeString(result, MESSAGE.slice(0, 5));

    act(() => {
      result.current.reset();
    });

    pressKey(result, 'I');
    expect(result.current.state.started).toBe(true);
    expect(result.current.state.typed).toBe('I');
  });

  test('reset after completion allows replaying', () => {
    const { result } = renderHook(() => useTypingGame());

    typeString(result, MESSAGE);
    expect(result.current.state.finished).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.state.finished).toBe(false);
    expect(result.current.state.started).toBe(false);
  });
});

// ── Progress ──────────────────────────────────────────────────────────────────

describe('progress', () => {
  test('progress reflects typed proportion', () => {
    const { result } = renderHook(() => useTypingGame());
    const half = Math.floor(MESSAGE.length / 2);

    typeString(result, MESSAGE.slice(0, half));

    const expected = (half / MESSAGE.length) * 100;
    expect(result.current.state.progress).toBeCloseTo(expected, 1);
  });

  test('progress reaches 100 at completion', () => {
    const { result } = renderHook(() => useTypingGame());

    typeString(result, MESSAGE);

    expect(result.current.state.progress).toBe(100);
  });
});
