"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

/**
 * Product photo thumbnail with a neutral placeholder — used everywhere a
 * product image might show up (POS cards, product pages, sale details).
 * Never renders a broken-image icon: a missing src or a failed load both
 * fall back to the same placeholder. Caller controls size/shape via
 * className (e.g. "h-12 w-12 rounded-lg" or "aspect-[3/4] w-full rounded-xl").
 */
export function ProductImage({
  src,
  alt,
  className = "",
  iconSize = 18,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  iconSize?: number;
}) {
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !src || failed;

  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-slate-100 ${className}`}>
      {showPlaceholder ? (
        <ImageOff size={iconSize} strokeWidth={1.5} className="text-slate-300" aria-hidden="true" />
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          sizes="200px"
          className="object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
