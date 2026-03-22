import { useCallback, useEffect, useRef, useState } from 'react';
import { MESSAGE } from '../constants';
import { calcAccuracy, calcErrors, calcWpm } from '../utils/gameUtils';

export default function useTypingGame(options = {}) {
  const { timeProvider = () => Date.now(), onEvent } = options;

  const [message] = useState(MESSAGE);
  const [typed, setTyped] = useState('');
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [wpm, setWpm] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [errors, setErrors] = useState(0);

  const [isMobile] = useState(
    () =>
      window.matchMedia('(max-width: 768px)').matches ||
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
  );

  const inputRef = useRef(null);
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const focus = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Focus the typing area on mount (desktop only)
  useEffect(() => {
    if (!isMobile) focus();
  }, [isMobile, focus]);

  const stopTimer = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const updateStats = useCallback(
    (typedStr, elapsedSec) => {
      setWpm(calcWpm(typedStr.length, elapsedSec));
      setAccuracy(calcAccuracy(typedStr, message));
      setErrors(calcErrors(typedStr, message));
    },
    [message],
  );

  const reset = useCallback(() => {
    stopTimer();
    startTimeRef.current = null;
    setTyped('');
    setStarted(false);
    setFinished(false);
    setElapsed(0);
    setWpm(null);
    setAccuracy(null);
    setErrors(0);
    setTimeout(focus, 0);
  }, [stopTimer, focus]);

  // Tab to restart
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        reset();
      }
    };

    window.addEventListener('keydown', handler);

    return () => window.removeEventListener('keydown', handler);
  }, [reset]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Tab') return;
      if (finished) return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        setTyped((t) => t.slice(0, -1));
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (typed.length >= message.length) return;
        const newTyped = typed + e.key;

        if (!started) {
          setStarted(true);
          startTimeRef.current = timeProvider();
          intervalRef.current = setInterval(() => {
            const secs = (timeProvider() - startTimeRef.current) / 1000;
            setElapsed(secs);
            setTyped((t) => {
              updateStats(t, secs);
              return t;
            });
          }, 100);
        }

        const secs = startTimeRef.current
          ? (timeProvider() - startTimeRef.current) / 1000
          : 0;
        setTyped(newTyped);
        updateStats(newTyped, secs);

        if (newTyped.length === message.length) {
          stopTimer();
          const finalElapsed = (timeProvider() - startTimeRef.current) / 1000;
          const finalWpm = calcWpm(newTyped.length, finalElapsed);
          const finalAccuracy = calcAccuracy(newTyped, message);
          const finalErrors = calcErrors(newTyped, message);
          setElapsed(finalElapsed);
          setWpm(finalWpm);
          setAccuracy(finalAccuracy);
          setErrors(finalErrors);
          setFinished(true);

          onEventRef.current?.({
            type: 'completed',
            payload: {
              wpm: finalWpm,
              accuracy: finalAccuracy,
              errors: finalErrors,
              elapsed: finalElapsed,
            },
          });
        }
      }
    },
    [typed, message, started, finished, timeProvider, updateStats, stopTimer],
  );

  useEffect(() => () => stopTimer(), [stopTimer]);

  const progress =
    message.length > 0 ? (typed.length / message.length) * 100 : 0;

  const state = {
    typed,
    message,
    elapsed,
    wpm,
    accuracy,
    errors,
    progress,
    started,
    finished,
  };

  return {
    state,
    isMobile,
    handleKeyDown,
    reset,
    inputRef,
    focus,
  };
}
