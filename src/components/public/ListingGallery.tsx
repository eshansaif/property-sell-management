"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

type Img = { id: string; url: string; altText: string | null };

export function ListingGallery({ images, title }: { images: Img[]; title: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const hasImages = images.length > 0;

  const next = useCallback(() => setActive((i) => (i + 1) % images.length), [images.length]);
  const prev = useCallback(() => setActive((i) => (i - 1 + images.length) % images.length), [images.length]);

  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, next, prev]);

  if (!hasImages) {
    return (
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-lg bg-surface-muted text-sm text-text-secondary">
        No images yet
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-2">
        {/* Main image — click to open full-screen lightbox */}
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="group relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-surface-muted"
          aria-label="Open full-size image"
        >
          <Image
            src={images[active].url}
            alt={images[active].altText ?? title}
            fill
            priority
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            sizes="(max-width: 1024px) 100vw, 66vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-text-primary opacity-0 shadow-md backdrop-blur-sm transition-opacity group-hover:opacity-100">
            ⤢ View full size
          </span>
          {images.length > 1 && (
            <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-text-primary shadow-md backdrop-blur-sm">
              {active + 1} / {images.length}
            </span>
          )}
        </button>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === active}
                className={`relative aspect-square overflow-hidden rounded-md bg-surface-muted transition-all duration-200 ${
                  i === active ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : "opacity-70 hover:opacity-100"
                }`}
              >
                <Image src={img.url} alt={img.altText ?? title} fill className="object-cover" sizes="150px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Full-screen lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close"
          >
            ✕
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-4"
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-4"
                aria-label="Next image"
              >
                ›
              </button>
            </>
          )}
          <div className="relative h-[80vh] w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <Image src={images[active].url} alt={images[active].altText ?? title} fill className="object-contain" sizes="90vw" />
          </div>
        </div>
      )}
    </div>
  );
}