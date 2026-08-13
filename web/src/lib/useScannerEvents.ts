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
  const onBarcodeRef = useRef(onBarcode);
  useEffect(() => {
    onBarcodeRef.current = onBarcode;
  });

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/scanner/events?since=${lastIdRef.current}`);
        if (!res.ok || cancelled) return;
        const body = (await res.json()) as { events?: { id: number; barcode: string }[]; connected?: boolean };
        if (cancelled) return;
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
