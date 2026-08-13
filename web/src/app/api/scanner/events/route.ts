import { NextRequest, NextResponse } from "next/server";
import { getEventsSince, isScannerConnected, pushScanEvent, recordHeartbeat } from "@/lib/scannerEvents";

// POST /api/scanner/events — the Android scanner posts either a decoded barcode
// ({ type: "scan", barcode, format? }) or a lightweight keepalive
// ({ type: "heartbeat" }) sent on a timer so the desktop can show a live
// Connected/Disconnected status independent of whether anything has been scanned yet.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { type, barcode, format } = body as Record<string, unknown>;

  if (type === "heartbeat") {
    recordHeartbeat();
    return NextResponse.json({ ok: true });
  }

  if (typeof barcode !== "string" || !barcode.trim()) {
    return NextResponse.json({ error: "barcode must be a non-empty string" }, { status: 400 });
  }

  const event = pushScanEvent(barcode.trim(), typeof format === "string" ? format : undefined);
  return NextResponse.json({ ok: true, id: event.id }, { status: 201 });
}

// GET /api/scanner/events?since=<id> — the desktop polls this for any new scan
// events plus the current scanner connection status.
export async function GET(request: NextRequest) {
  const sinceParam = new URL(request.url).searchParams.get("since");
  const since = Number(sinceParam) || 0;
  return NextResponse.json({ events: getEventsSince(since), connected: isScannerConnected() });
}
