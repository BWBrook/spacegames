/**
 * Timing for BASIC listings, measured on a BBC Micro in jsbeeb, which runs
 * the genuine OS 1.20 and BASIC II ROMs, and timed with BASIC's own TIME.
 *
 * Empty FOR loops were the period's way to pause, and their length depended
 * entirely on the interpreter. The disk writes them with FOR and NEXT I on
 * separate lines, and BBC BASIC runs that form at 0.646 ms an iteration. The
 * Sinclair machines the book also targeted were several times slower. Our
 * canon is a BBC disk, so the retro lanes reproduce how that disk played on
 * a BBC, and every lane shares this reading.
 */
export const BBC_EMPTY_LOOP_SECONDS = 0.646 / 1000;

export function emptyLoopSeconds(iterations: number) {
  return iterations * BBC_EMPTY_LOOP_SECONDS;
}

/** INKEY(n) and INKEY$(n) wait on the OS centisecond clock, the same on every machine. */
export function centiseconds(count: number) {
  return count / 100;
}

/**
 * INKEY$(1) with nothing in the buffer returns on the next tick of that
 * clock, so a listing that polls it once a pass has its passes rounded up to
 * whole centiseconds. The small allowance absorbs floating-point drift in a
 * clock built from sums of decimal fractions.
 */
export function nextCentisecondTick(seconds: number) {
  return (Math.floor(seconds * 100 + 1e-6) + 1) / 100;
}
