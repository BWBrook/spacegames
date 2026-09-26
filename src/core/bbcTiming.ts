/**
 * Timing for BASIC listings.
 *
 * Empty FOR loops were the period's way to pause, and their length depended
 * entirely on the interpreter. BBC BASIC ran roughly a thousand empty
 * iterations a second; the Sinclair machines the book also targeted were
 * several times slower. Our canon is a BBC disk, so the retro lanes reproduce
 * how that disk actually played on a BBC, and every lane shares this reading.
 */
export const BBC_EMPTY_LOOP_SECONDS = 1 / 1000;

export function emptyLoopSeconds(iterations: number) {
  return iterations * BBC_EMPTY_LOOP_SECONDS;
}

/**
 * For listings that never pause and so run as fast as the interpreter can
 * manage: statements that do work (PRINT, LET, PLOT) cost about a quarter
 * more than the bare NEXT the constant above measures.
 */
export const BBC_STATEMENT_WEIGHT = 1.25;

export function statementSeconds(count: number) {
  return emptyLoopSeconds(count) * BBC_STATEMENT_WEIGHT;
}

/** INKEY(n) and INKEY$(n) wait on the OS centisecond clock, the same on every machine. */
export function centiseconds(count: number) {
  return count / 100;
}
