// In-memory scanner event queue — deliberately NOT Neon/Prisma. This is transient
// session data (a phone pushing barcode values at the desktop) rather than business
// data, so a plain module-level singleton is the right amount of infrastructure: no
// new table, no persistence guarantee needed. Server-restart or dev Fast Refresh
// clearing this is fine — reconnection just needs one more heartbeat/scan.
//
// The one thing that DOES need to survive a restart gracefully is the desktop
// browser's polling cursor (see useScannerEvents.ts, which persists the last-seen
// event id across page refreshes). Since `nextId` restarts at 1 every time this
// module re-initializes, a browser tab holding an old, higher cursor would filter
// out every future event forever. SERVER_INSTANCE_ID is a fresh random value each
// time this module loads, so the client can detect "the counter I remember doesn't
// belong to this server anymore" and reset itself — without needing any persistence
// here beyond this one in-memory string.

import { randomUUID } from "crypto";

export interface ScannerEvent {
  id: number;
  barcode: string;
  format?: string;
  timestamp: number;
}

const MAX_EVENTS = 50;
const CONNECTED_WINDOW_MS = 15_000;

const SERVER_INSTANCE_ID = randomUUID();

let events: ScannerEvent[] = [];
let nextId = 1;
let lastSeenAt: number | null = null;

/** Identifies this running server process/module-instance. Changes on every
 * restart (or dev Fast-Refresh reload of this module) — see comment above. */
export function getServerInstanceId(): string {
  return SERVER_INSTANCE_ID;
}

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
