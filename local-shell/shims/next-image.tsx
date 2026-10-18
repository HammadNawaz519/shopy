/**
 * Local-shell stand-in for `next/image`.
 *
 * The instant-launch shell is a plain React app (no Next runtime), so the
 * optimized-image pipeline is unavailable. Every component in the shell tree
 * imports `next/image` — esbuild aliases that specifier to this module, which
 * renders an equivalent <img> with the same layout semantics:
 *
 *  - `fill`      → absolutely positioned, object-cover (same box as next/image)
 *  - `priority`  → eager load; everything else lazy
 *  - `style`     → merged after the fill defaults (objectFit/Position overrides)
 *  - `sizes`, `quality`, `srcSet` are next/image-only and intentionally dropped
 *
 * The `src` values used by the landing components are either APK-bundled
 * static assets (public/*.jpg — copied next to this bundle) or remote
 * content-addressed media (supabase / /api/media). Both work with a plain
 * <img>; same-origin static assets also keep the StatusBarTint canvas
 * sampling untainted, exactly like the real app's /_next/image responses do.
 */
import React from "react";
import { resolveMediaUrl } from "../media";

export interface ImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  loading?: "eager" | "lazy";
  sizes?: string;
  quality?: number;
  unoptimized?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLImageElement>;
}

export default function Image({
  src,
  alt,
  fill,
  priority,
  loading,
  className,
  style,
  onClick,
}: ImageProps) {
  const fillStyle: React.CSSProperties = fill
    ? {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "center",
        pointerEvents: "none",
      }
    : {};

  // Resolve media that the local shell does not bundle to the live origin so
  // it loads after the first frame instead of 404ing on the local origin.
  const resolvedSrc = resolveMediaUrl(src);

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      loading={loading ?? (priority ? "eager" : "lazy")}
      decoding="async"
      draggable={false}
      className={className}
      style={fill ? { ...fillStyle, ...style } : style}
      onClick={onClick}
    />
  );
}
