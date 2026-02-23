import { describe, expect, test } from 'vitest';
import { calcAccuracy, calcErrors, calcWpm } from './gameUtils';

// ── calcWpm ──────────────────────────────────────────────────────────────────

describe('calcWpm', () => {
  test('returns 0 when charCount is 0', () => {
    expect(calcWpm(0, 10)).toBe(0);
  });

  test('returns 0 when elapsedSec is 0', () => {
    expect(calcWpm(50, 0)).toBe(0);
  });

  test('calculates correctly using 5-char-per-word standard', () => {
    // 50 chars / 5 = 10 words, over 30s = 20 WPM
    expect(calcWpm(50, 30)).toBe(20);
  });

  test('calculates correctly at 60 WPM pace', () => {
    // 300 chars / 5 = 60 words, over 60s = 60 WPM
    expect(calcWpm(300, 60)).toBe(60);
  });

  test('rounds to nearest integer', () => {
    // 10 chars / 5 = 2 words, over 1.5s = 80 WPM
    expect(calcWpm(10, 1.5)).toBe(80);
  });
});

// ── calcAccuracy ─────────────────────────────────────────────────────────────

describe('calcAccuracy', () => {
  test('returns 0 when nothing has been typed', () => {
    expect(calcAccuracy('', 'hello world')).toBe(0);
  });

  test('returns 100 when all characters are correct', () => {
    expect(calcAccuracy('hello', 'hello world')).toBe(100);
  });

  test('returns 0 when all characters are wrong', () => {
    expect(calcAccuracy('xxxxx', 'hello world')).toBe(0);
  });

  test('returns 50 when half the characters are correct', () => {
    expect(calcAccuracy('heXXX', 'hello')).toBe(40);
  });

  test('rounds to nearest integer', () => {
    // 2 correct out of 3 = 66.67% → 67
    expect(calcAccuracy('heX', 'hel')).toBe(67);
  });
});

// ── calcErrors ───────────────────────────────────────────────────────────────

describe('calcErrors', () => {
  test('returns 0 when nothing has been typed', () => {
    expect(calcErrors('', 'hello world')).toBe(0);
  });

  test('returns 0 when all characters are correct', () => {
    expect(calcErrors('hello', 'hello world')).toBe(0);
  });

  test('counts every incorrect character', () => {
    expect(calcErrors('hXllX', 'hello')).toBe(2);
  });

  test('counts all characters as errors when fully wrong', () => {
    expect(calcErrors('xxxxx', 'hello')).toBe(5);
  });

  test('only counts characters typed so far, not the full message', () => {
    // typed 3 chars, 1 wrong — doesn't penalise untyped chars
    expect(calcErrors('heX', 'hello world')).toBe(1);
  });
});
