// In-memory scanner event queue — deliberately NOT Neon/Prisma. This is transient
// session data (a phone pushing barcode values at the desktop) rather than business
// data, so a plain module-level singleton is the right amount of infrastructure: no
// new table, no persistence guarantee needed. Server-restart or dev Fast Refresh
// clearing this is fine — reconnection just needs one more heartbeat/scan.

export interface ScannerEvent {
  id: number;
  barcode: string;
  format?: string;
  timestamp: number;
}

const MAX_EVENTS = 50;
const CONNECTED_WINDOW_MS = 15_000;

let events: ScannerEvent[] = [];
let nextId = 1;
let lastSeenAt: number | null = null;

/** Called on both real scans and heartbeats — either is evidence the phone is reachable. */
export function recordHeartbeat(): void {
  lastSeenAt = Date.now();
}

export function pushScanEvent(barcode: string, format?: string): ScannerEvent {
  const event: ScannerEvent = { id: nextId++, barcode, format, timestamp: Date.now() };
  events.push(event);
  if (events.length > MAX_EVENTS) events = events.slice(-MAX_EVENTS);
  lastSeenAt = Date.now();
  return event;
}

export function getEventsSince(sinceId: number): ScannerEvent[] {
  return events.filter((e) => e.id > sinceId);
}

export function isScannerConnected(): boolean {
  return lastSeenAt !== null && Date.now() - lastSeenAt < CONNECTED_WINDOW_MS;
}
