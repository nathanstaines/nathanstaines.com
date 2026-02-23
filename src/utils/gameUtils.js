/**
 * Calculates words per minute using the standard 5-chars-per-word formula.
 * @param {number} charCount - number of characters typed
 * @param {number} elapsedSec - elapsed time in seconds
 * @returns {number}
 */
export function calcWpm(charCount, elapsedSec) {
  if (!charCount || !elapsedSec) return 0;
  return Math.round((charCount / 5 / elapsedSec) * 60);
}

/**
 * Calculates accuracy as a percentage of correct characters typed.
 * @param {string} typed
 * @param {string} message
 * @returns {number}
 */
export function calcAccuracy(typed, message) {
  if (!typed.length) return 0;
  const correct = [...typed].filter((ch, i) => ch === message[i]).length;
  return Math.round((correct / typed.length) * 100);
}

/**
 * Counts the number of incorrect characters in the typed string.
 * @param {string} typed
 * @param {string} message
 * @returns {number}
 */
export function calcErrors(typed, message) {
  return [...typed].filter((ch, i) => ch !== message[i]).length;
}
