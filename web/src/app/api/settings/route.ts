import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

async function getOrCreateSettings() {
  return prisma.appSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
}

// GET /api/settings
export async function GET() {
  const settings = await getOrCreateSettings();
  return NextResponse.json(settings);
}

// PATCH /api/settings — { lowStockThreshold?, currencySymbol? }
export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { lowStockThreshold, currencySymbol } = body as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if (lowStockThreshold !== undefined) {
    if (!Number.isInteger(lowStockThreshold) || (lowStockThreshold as number) < 0) {
      return NextResponse.json({ error: "lowStockThreshold must be a non-negative integer" }, { status: 400 });
    }
    data.lowStockThreshold = lowStockThreshold;
  }
  if (currencySymbol !== undefined) {
    if (typeof currencySymbol !== "string" || !currencySymbol.trim()) {
      return NextResponse.json({ error: "currencySymbol must be a non-empty string" }, { status: 400 });
    }
    data.currencySymbol = currencySymbol.trim();
  }

  await getOrCreateSettings();
  const updated = await prisma.appSettings.update({ where: { id: 1 }, data });
  return NextResponse.json(updated);
}
