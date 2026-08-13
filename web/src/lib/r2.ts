// Cloudflare R2 (S3-compatible) object storage for product images.
// Server-only: this module reads the R2 secret key, so it must never be
// imported from client components. Neon/Postgres stays the source of truth
// for product/sale/inventory data — R2 holds only the image bytes,
// referenced from Product.imageKey.

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import type { AllowedImageType } from "./imageValidation";
import { extensionForType } from "./imageValidation";

const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

function requireR2Config() {
  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT || !R2_BUCKET_NAME) {
    throw new Error("R2 storage is not configured (missing R2_* environment variables)");
  }
  return { R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET_NAME };
}

let client: S3Client | null = null;

function getClient(): S3Client {
  if (client) return client;
  const config = requireR2Config();
  client = new S3Client({
    region: "auto",
    endpoint: config.R2_ENDPOINT,
    credentials: {
      accessKeyId: config.R2_ACCESS_KEY_ID,
      secretAccessKey: config.R2_SECRET_ACCESS_KEY,
    },
  });
  return client;
}

/** Stable, non-guessable object key — never derived from the user-supplied filename. */
export function generateProductImageKey(contentType: AllowedImageType): string {
  return `products/${randomUUID()}.${extensionForType(contentType)}`;
}

export async function uploadProductImage(key: string, body: Buffer, contentType: string): Promise<void> {
  const { R2_BUCKET_NAME } = requireR2Config();
  await getClient().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function deleteProductImage(key: string): Promise<void> {
  const { R2_BUCKET_NAME } = requireR2Config();
  await getClient().send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
}

/** Best-effort cleanup — logs instead of throwing so a failed delete never fails the caller's main operation. */
export async function tryDeleteProductImage(key: string): Promise<void> {
  try {
    await deleteProductImage(key);
  } catch (err) {
    console.error(`Failed to delete R2 object "${key}":`, err);
  }
}

export interface FetchedImage {
  body: ReadableStream | null;
  contentType: string | undefined;
  contentLength: number | undefined;
}

export async function fetchProductImage(key: string): Promise<FetchedImage> {
  const { R2_BUCKET_NAME } = requireR2Config();
  const result = await getClient().send(new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
  return {
    body: (result.Body as { transformToWebStream?: () => ReadableStream } | undefined)?.transformToWebStream?.() ?? null,
    contentType: result.ContentType,
    contentLength: result.ContentLength,
  };
}
