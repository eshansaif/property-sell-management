"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useToast } from "@/components/ui/Toast";

export type UploadedImage = { id: string; url: string; uploading?: boolean; error?: string };

let idCounter = 0;
const nextId = () => `img-${Date.now()}-${idCounter++}`;

export function ImageUploader({
  images,
  onChange,
}: {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
}) {
  const toast = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Kept in sync on every render so async upload callbacks below always
  // merge against the latest images array, even if several uploads
  // resolve out of order.
  const currentImagesRef = useRef(images);
  currentImagesRef.current = images;

  function replaceImage(id: string, next: UploadedImage) {
    onChange(currentImagesRef.current.map((img) => (img.id === id ? next : img)));
  }

  async function handleFiles(files: FileList | File[]) {
    const fileArray = Array.from(files);
    const newItems: UploadedImage[] = fileArray.map(() => ({ id: nextId(), url: "", uploading: true }));

    onChange([...currentImagesRef.current, ...newItems]);

    let uploaded = 0;
    await Promise.all(
      fileArray.map(async (file, i) => {
        const placeholderId = newItems[i].id;
        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await fetch("/api/upload", { method: "POST", body: formData });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Upload failed");
          replaceImage(placeholderId, { id: placeholderId, url: data.url });
          uploaded++;
        } catch (err: any) {
          replaceImage(placeholderId, { id: placeholderId, url: "", error: err.message || "Upload failed" });
          toast.error(`Couldn't upload ${file.name}`, err.message || "Upload failed");
        }
      })
    );
    if (uploaded > 0) toast.success(`${uploaded} image${uploaded > 1 ? "s" : ""} uploaded`);
  }

  function removeImage(id: string) {
    onChange(images.filter((img) => img.id !== id));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  }

  // Reordering via native drag events on the thumbnail grid.
  function onThumbDragStart(index: number) {
    setDragIndex(index);
  }
  function onThumbDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const reordered = [...images];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);
    setDragIndex(index);
    onChange(reordered);
  }
  function onThumbDragEnd() {
    setDragIndex(null);
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragActive ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
        }`}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-text-secondary">
          <path d="M12 16V4m0 0L7 9m5-5l5 5M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-sm text-text-primary">Drag & drop images, or click to browse</p>
        <p className="text-xs text-text-secondary">JPG, PNG, WebP or AVIF — up to 8MB each. First image is the cover.</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          className="hidden"
          onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ""; }}
        />
      </div>

      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {images.map((img, i) => (
            <div
              key={img.id}
              draggable={!img.uploading && !img.error}
              onDragStart={() => onThumbDragStart(i)}
              onDragOver={(e) => onThumbDragOver(e, i)}
              onDragEnd={onThumbDragEnd}
              className="group relative aspect-square overflow-hidden rounded-md border border-border bg-surface-muted"
            >
              {img.uploading && (
                <div className="flex h-full w-full items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                </div>
              )}
              {img.error && (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-1 text-center">
                  <p className="text-[10px] text-error">{img.error}</p>
                  <button type="button" onClick={() => removeImage(img.id)} className="text-[10px] text-text-secondary underline">Remove</button>
                </div>
              )}
              {!img.uploading && !img.error && img.url && (
                <>
                  <Image src={img.url} alt="" fill className="object-cover" sizes="150px" />
                  {i === 0 && (
                    <span className="absolute left-1 top-1 rounded bg-primary/90 px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface/90 text-text-primary opacity-0 shadow transition-opacity group-hover:opacity-100"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
