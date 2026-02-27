import { useCallback, useEffect, useRef, useState } from 'react';
import ReactGA from 'react-ga4';
import { MESSAGE } from '../constants';
import { calcAccuracy, calcErrors, calcWpm } from '../utils/gameUtils';

export default function useTypingGame() {
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

  const areaRef = useRef(null);
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);

  const focusArea = useCallback(() => {
    areaRef.current?.focus();
  }, []);

  // Focus the typing area on mount (desktop only)
  useEffect(() => {
    if (!isMobile) focusArea();
  }, [isMobile, focusArea]);

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
    setTimeout(focusArea, 0);
  }, [stopTimer, focusArea]);

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
          startTimeRef.current = Date.now();
          intervalRef.current = setInterval(() => {
            const secs = (Date.now() - startTimeRef.current) / 1000;
            setElapsed(secs);
            setTyped((t) => {
              updateStats(t, secs);
              return t;
            });
          }, 100);
        }

        const secs = startTimeRef.current
          ? (Date.now() - startTimeRef.current) / 1000
          : 0;
        setTyped(newTyped);
        updateStats(newTyped, secs);

        if (newTyped.length === message.length) {
          stopTimer();
          const finalElapsed = (Date.now() - startTimeRef.current) / 1000;
          setElapsed(finalElapsed);
          setWpm(calcWpm(newTyped.length, finalElapsed));
          setAccuracy(calcAccuracy(newTyped, message));
          setErrors(calcErrors(newTyped, message));
          setFinished(true);

          ReactGA.event({
            category: 'game',
            action: 'completed',
            label: `${calcWpm(newTyped.length, finalElapsed)} wpm`,
          });
        }
      }
    },
    [typed, message, started, finished, updateStats, stopTimer],
  );

  useEffect(() => () => stopTimer(), [stopTimer]);

  const progress =
    message.length > 0 ? (typed.length / message.length) * 100 : 0;

  return {
    message,
    typed,
    started,
    finished,
    elapsed,
    wpm,
    accuracy,
    errors,
    isMobile,
    progress,
    areaRef,
    focusArea,
    handleKeyDown,
  };
}
