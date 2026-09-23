/**
 * How PRINT shows a number on a BBC with the default @% of &90A: general
 * format, nine significant figures, no trailing zeros, and E notation below
 * 0.1 or from 1E9 up, as the BBC's general format does. The BBC used 40-bit
 * floats, so the ninth digit can occasionally differ.
 */
export function formatBbcNumber(value: number): string {
  if (value === 0) return '0';
  const magnitude = Math.abs(value);
  const trim = (digits: string) => digits.replace(/0+$/, '').replace(/\.$/, '');
  if (magnitude >= 1e9 || magnitude < 0.1) {
    const [mantissa = '0', exponent = '0'] = value.toExponential(8).split('e');
    return `${trim(mantissa)}E${Number(exponent)}`;
  }
  const fixed = value.toPrecision(9);
  return fixed.includes('.') ? trim(fixed) : fixed;
}

/** BBC INPUT into a numeric variable reads a blank or non-numeric line as 0. */
export function readBbcNumber(raw: string) {
  const value = Number.parseFloat(raw.trim());
  return Number.isNaN(value) ? 0 : value;
}
