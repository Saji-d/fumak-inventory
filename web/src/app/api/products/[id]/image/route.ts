import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeProduct } from "@/lib/serializers";
import { validateImageFile, isAllowedImageType } from "@/lib/imageValidation";
import { generateProductImageKey, uploadProductImage, tryDeleteProductImage, fetchProductImage } from "@/lib/r2";

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// POST /api/products/[id]/image — replace the product's photo.
// Upload order matters for safety: the new object goes to R2 first, then
// Product.imageKey is updated, and only after that succeeds is the old R2
// object (if any) removed. A failure at any step leaves the product with
// whichever image was already committed to the database — never a
// dangling reference to bytes that don't exist.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) return NextResponse.json({ error: "Invalid product id" }, { status: 400 });

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A file field is required" }, { status: 400 });
  }

  const validationError = validateImageFile(file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }
  if (!isAllowedImageType(file.type)) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  }

  const key = generateProductImageKey(file.type);
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    await uploadProductImage(key, buffer, file.type);
  } catch (err) {
    console.error("R2 upload failed:", err);
    return NextResponse.json({ error: "Failed to upload image. Please try again." }, { status: 502 });
  }

  let updated;
  try {
    updated = await prisma.product.update({ where: { id }, data: { imageKey: key } });
  } catch (err) {
    // DB write failed after a successful upload — clean up the now-orphaned object.
    await tryDeleteProductImage(key);
    console.error("Failed to save image reference:", err);
    return NextResponse.json({ error: "Failed to save image. Please try again." }, { status: 500 });
  }

  if (existing.imageKey && existing.imageKey !== key) {
    await tryDeleteProductImage(existing.imageKey);
  }

  return NextResponse.json(serializeProduct(updated));
}

// DELETE /api/products/[id]/image — remove the product's photo (revert to placeholder).
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) return NextResponse.json({ error: "Invalid product id" }, { status: 400 });

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const updated = await prisma.product.update({ where: { id }, data: { imageKey: null } });
  if (existing.imageKey) {
    await tryDeleteProductImage(existing.imageKey);
  }

  return NextResponse.json(serializeProduct(updated));
}

// GET /api/products/[id]/image — streams the image bytes from R2. This is
// the only path the browser ever loads images through; R2 credentials never
// leave the server.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) return NextResponse.json({ error: "Invalid product id" }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id }, select: { imageKey: true } });
  if (!product?.imageKey) {
    return NextResponse.json({ error: "No image for this product" }, { status: 404 });
  }

  try {
    const { body, contentType, contentLength } = await fetchProductImage(product.imageKey);
    if (!body) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }
    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        ...(contentLength !== undefined ? { "Content-Length": String(contentLength) } : {}),
      },
    });
  } catch (err) {
    console.error("Failed to fetch image from R2:", err);
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
}
