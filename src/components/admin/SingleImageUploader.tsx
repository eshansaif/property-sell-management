"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useToast } from "@/components/ui/Toast";

/**
 * Single-image uploader — used wherever exactly one image is needed
 * (service/sub-service cover image, client logo, site hero image).
 * For multi-image listing galleries, see ImageUploader.tsx instead.
 */
export function SingleImageUploader({
  value,
  onChange,
  label = "Image",
  helpText = "JPG, PNG, WebP or AVIF — up to 8MB.",
  aspect = "aspect-video",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  helpText?: string;
  aspect?: string;
}) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onChange(data.url);
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error("Couldn't upload image", err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  if (value) {
    return (
      <div>
        <label className="label">{label}</label>
        <div className={`group relative w-full max-w-sm overflow-hidden rounded-lg border border-border bg-surface-muted ${aspect}`}>
          <Image src={value} alt="" fill className="object-cover" sizes="400px" />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-text-primary shadow"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-error shadow"
            >
              Remove
            </button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        />
      </div>
    );
  }

  return (
    <div>
      <label className="label">{label}</label>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`flex w-full max-w-sm cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${aspect} ${
          dragActive ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
        }`}
      >
        {uploading ? (
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        ) : (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-text-secondary">
              <path d="M12 16V4m0 0L7 9m5-5l5 5M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-xs text-text-primary">Drag & drop, or click to upload</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        />
      </div>
      <p className="mt-1.5 text-xs text-text-secondary">{helpText}</p>
    </div>
  );
}
