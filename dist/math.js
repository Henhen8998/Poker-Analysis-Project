export function analyze(pot, call, equity) {
  if (![pot, call, equity].every(Number.isFinite) || pot < 0 || call < 0 || equity < 0 || equity > 100 || pot + call <= 0) throw new Error('Enter nonnegative amounts, a positive final pot, and equity from 0 to 100.');
  const finalPot = pot + call;
  return { finalPot, required: call / finalPot * 100, ev: equity / 100 * finalPot - call, fold: 0 };
}
