"use client";

import { useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 1000;

// The server's event queue (lib/scannerEvents.ts) is a long-lived in-memory buffer,
// not per-browser-session — it happily replays the last ~50 scans to anyone who
// polls with since=0. Persisting the last-processed id to sessionStorage (same
// scope as the cart in lib/pos.ts) means a page refresh resumes from where this
// tab already got to, instead of re-delivering already-handled scans and popping
// a just-dismissed Found/New-Product card back open.
const LAST_EVENT_ID_KEY = "fumak.pos.scannerEvents.lastId";

// But that queue is in-memory only — it resets to id 1 every time the desktop
// server restarts (or a dev Fast-Refresh reloads that module). A tab that already
// persisted a higher lastId would then have every future event filtered out
// server-side forever (`id > since` never matches), with no error anywhere — the
// scanner would just silently stop working until the tab was closed. Persisting
// the server's own instance id alongside the cursor lets us detect that mismatch
// and reset the cursor instead of trusting a number that no longer means anything.
const LAST_SERVER_ID_KEY = "fumak.pos.scannerEvents.serverId";

function loadLastEventId(): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(window.sessionStorage.getItem(LAST_EVENT_ID_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveLastEventId(id: number): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(LAST_EVENT_ID_KEY, String(id));
  } catch {
    // sessionStorage unavailable — cursor just won't survive a refresh.
  }
}

function loadLastServerId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(LAST_SERVER_ID_KEY);
  } catch {
    return null;
  }
}

function saveLastServerId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(LAST_SERVER_ID_KEY, id);
  } catch {
    // sessionStorage unavailable — same fallback as the id cursor above.
  }
}

/**
 * Polls GET /api/scanner/events for barcodes pushed by the Android scanner and the
 * live connection status. Each event fires onBarcode exactly once (tracked via the
 * last-seen id), matching the simplicity level of the debounced name-search effect
 * already used in ScanPanel — no WebSocket/SSE infrastructure for a human-scanning
 * cadence.
 */
export function useScannerEvents(onBarcode: (barcode: string) => void): { connected: boolean } {
  const [connected, setConnected] = useState(false);
  const lastIdRef = useRef(loadLastEventId());
  const serverIdRef = useRef(loadLastServerId());
  const onBarcodeRef = useRef(onBarcode);
  useEffect(() => {
    onBarcodeRef.current = onBarcode;
  });

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const requestedSince = lastIdRef.current;
        const res = await fetch(`/api/scanner/events?since=${requestedSince}`);
        if (!res.ok || cancelled) return;
        const body = (await res.json()) as {
          events?: { id: number; barcode: string }[];
          connected?: boolean;
          serverInstanceId?: string;
        };
        if (cancelled) return;

        const serverInstanceId = typeof body.serverInstanceId === "string" ? body.serverInstanceId : null;
        const serverRestarted =
          serverInstanceId !== null && serverIdRef.current !== null && serverInstanceId !== serverIdRef.current;
        if (serverInstanceId !== null) {
          serverIdRef.current = serverInstanceId;
          saveLastServerId(serverInstanceId);
        }

        if (serverRestarted && requestedSince !== 0) {
          // The cursor we just sent belonged to a server instance that no longer
          // exists — this response's `events` may have been wrongly filtered to
          // empty against a counter that already restarted from 1. Drop the stale
          // cursor and re-poll immediately with since=0 so the very first poll
          // after a restart still surfaces whatever's currently queued, rather
          // than silently going quiet until the tab is reopened.
          lastIdRef.current = 0;
          saveLastEventId(0);
          setConnected(Boolean(body.connected));
          await poll();
          return;
        }

        setConnected(Boolean(body.connected));
        for (const event of body.events ?? []) {
          lastIdRef.current = Math.max(lastIdRef.current, event.id);
          onBarcodeRef.current(event.barcode);
        }
        if ((body.events ?? []).length > 0) saveLastEventId(lastIdRef.current);
      } catch {
        if (!cancelled) setConnected(false);
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { connected };
}
