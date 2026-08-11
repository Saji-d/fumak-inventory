// Money is stored as integer POISHA (1/100 BDT) everywhere, never float,
// to avoid rounding drift when summing sales. These helpers convert
// poisha <-> a formatted currency string for display purposes only.

export function poishaToTaka(poisha: number): number {
  return poisha / 100;
}

export function takaToPoisha(taka: number): number {
  return Math.round(taka * 100);
}

export function formatMoney(poisha: number, currencySymbol = "৳"): string {
  const taka = poishaToTaka(poisha);
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(taka));
  const sign = taka < 0 ? "-" : "";
  return `${sign}${currencySymbol}${formatted}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
