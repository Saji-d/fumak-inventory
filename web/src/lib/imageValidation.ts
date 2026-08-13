// Shared client+server constants for product image uploads. No DOM/Node
// APIs here so this same module works in both the browser (form validation)
// and API routes (server-side re-validation — never trust the client alone).

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type AllowedImageType = keyof typeof ALLOWED_IMAGE_TYPES;

export function isAllowedImageType(contentType: string): contentType is AllowedImageType {
  return Object.prototype.hasOwnProperty.call(ALLOWED_IMAGE_TYPES, contentType);
}

export function extensionForType(contentType: AllowedImageType): string {
  return ALLOWED_IMAGE_TYPES[contentType];
}

export function validateImageFile(file: { type: string; size: number }): string | null {
  if (!isAllowedImageType(file.type)) {
    return "Only JPG, PNG, or WEBP images are supported.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `Image must be ${MAX_IMAGE_BYTES / (1024 * 1024)}MB or smaller.`;
  }
  return null;
}
