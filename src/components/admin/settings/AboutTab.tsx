"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { safeFetch, readError } from "@/lib/safe-fetch";
import { SingleImageUploader } from "@/components/admin/SingleImageUploader";
import type { SiteSettings } from "@/lib/site-settings";

export function AboutTab() {
  const toast = useToast();
  const [form, setForm] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await safeFetch("/api/admin/settings");
      if (!res.ok) return toast.error("Couldn't load About page", await readError(res));
      setForm(await res.json());
    })();
  }, [toast]);

  if (!form) {
    return (
      <div className="card max-w-2xl space-y-4 p-6">
        <Skeleton className="h-10 w-full" /><Skeleton className="h-40 w-full" />
      </div>
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    // Settings are saved as one set, so we send the full current values back with the About edits.
    const res = await safeFetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (!res.ok) return toast.error("Couldn't save About page", await readError(res));
    toast.success("About page saved", "Visible now at /about.");
  }

  return (
    <form onSubmit={save} className="card max-w-2xl space-y-5 p-6">
      <div>
        <label className="label">Page title *</label>
        <input className="input" required maxLength={100} value={form.aboutTitle} onChange={(e) => setForm({ ...form, aboutTitle: e.target.value })} />
      </div>
      <div>
        <label className="label">Content</label>
        <textarea className="input" rows={10} maxLength={8000} value={form.aboutContent} onChange={(e) => setForm({ ...form, aboutContent: e.target.value })} placeholder="Tell visitors who you are. Leave a blank line between paragraphs." />
        <p className="mt-1 text-xs text-text-secondary">{form.aboutContent.length}/8000</p>
      </div>
      <SingleImageUploader
        label="Image (optional)"
        helpText="Shown beside the text on the About page."
        aspect="aspect-[4/3]"
        value={form.aboutImage}
        onChange={(url) => setForm({ ...form, aboutImage: url })}
      />
      <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Save About page"}</button>
    </form>
  );
}
