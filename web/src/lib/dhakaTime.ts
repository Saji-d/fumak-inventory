// Date-boundary math for Asia/Dhaka (UTC+6, no DST — Bangladesh has used a
// single fixed offset since 2009), used by the sales-history filters.
// Sale.timestamp is stored as a UTC instant; "August 2026" or "13 Aug" means
// a range in *local* Dhaka wall-clock time, so we convert local boundaries
// to UTC instants rather than comparing formatted strings.

const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

export interface DateRange {
  start: Date;
  end: Date; // exclusive
}

/** The UTC instant for Dhaka local midnight on the given Dhaka-local Y/M/D. */
function dhakaMidnightUtc(year: number, month1to12: number, day: number): Date {
  return new Date(Date.UTC(year, month1to12 - 1, day, 0, 0, 0, 0) - DHAKA_OFFSET_MS);
}

/** Today's date as seen in Dhaka right now, independent of the server's own timezone. */
export function getDhakaToday(): { year: number; month: number; day: number } {
  const dhakaNow = new Date(Date.now() + DHAKA_OFFSET_MS);
  return {
    year: dhakaNow.getUTCFullYear(),
    month: dhakaNow.getUTCMonth() + 1,
    day: dhakaNow.getUTCDate(),
  };
}

/** [start of month, start of next month) in Dhaka local time. */
export function dhakaMonthRange(year: number, month1to12: number): DateRange {
  const start = dhakaMidnightUtc(year, month1to12, 1);
  const end = month1to12 === 12 ? dhakaMidnightUtc(year + 1, 1, 1) : dhakaMidnightUtc(year, month1to12 + 1, 1);
  return { start, end };
}

/** [start of day, start of next day) in Dhaka local time. */
export function dhakaDayRange(year: number, month1to12: number, day: number): DateRange {
  const start = dhakaMidnightUtc(year, month1to12, day);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/** Parses a "YYYY-MM-DD" string into a Dhaka-local day range. Returns null if malformed. */
export function parseDhakaDate(value: string): DateRange | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match;
  return dhakaDayRange(Number(y), Number(m), Number(d));
}

/** [start of `from` day, start of the day after `to`) in Dhaka local time. */
export function parseDhakaRange(fromValue: string, toValue: string): DateRange | null {
  const from = parseDhakaDate(fromValue);
  const to = parseDhakaDate(toValue);
  if (!from || !to) return null;
  return { start: from.start, end: to.end };
}
