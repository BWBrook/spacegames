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

/** INKEY(n) and INKEY$(n) wait on the OS centisecond clock, the same on every machine. */
export function centiseconds(count: number) {
  return count / 100;
}
