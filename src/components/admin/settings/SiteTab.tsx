"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { safeFetch, readError } from "@/lib/safe-fetch";
import type { SiteSettings } from "@/lib/site-settings";

export function SiteTab() {
  const toast = useToast();
  const [form, setForm] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await safeFetch("/api/admin/settings");
      if (!res.ok) return toast.error("Couldn't load site settings", await readError(res));
      setForm(await res.json());
    })();
  }, [toast]);

  if (!form) {
    return (
      <div className="card max-w-2xl space-y-4 p-6">
        {Array.from({ length: 5 }).map((_, i) => <div key={i}><Skeleton className="h-3 w-24" /><Skeleton className="mt-2 h-10 w-full" /></div>)}
      </div>
    );
  }

  const set = (k: keyof SiteSettings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await safeFetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (!res.ok) return toast.error("Couldn't save settings", await readError(res));
    toast.success("Settings saved", "The public site header, footer and page titles are updated.");
  }

  return (
    <form onSubmit={save} className="card max-w-2xl space-y-5 p-6">
      <div>
        <label className="label">Site name *</label>
        <input className="input" required maxLength={60} value={form.siteName} onChange={set("siteName")} />
      </div>
      <div>
        <label className="label">Tagline</label>
        <textarea className="input" rows={2} maxLength={200} value={form.tagline} onChange={set("tagline")} placeholder="Shown in the footer and used as the default SEO description" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">Contact email</label><input type="email" className="input" value={form.contactEmail} onChange={set("contactEmail")} /></div>
        <div><label className="label">Contact phone</label><input className="input" value={form.contactPhone} onChange={set("contactPhone")} /></div>
        <div><label className="label">WhatsApp number</label><input className="input" value={form.whatsapp} onChange={set("whatsapp")} placeholder="e.g. 8801XXXXXXXXX" /></div>
        <div><label className="label">Address</label><input className="input" value={form.address} onChange={set("address")} /></div>
        <div><label className="label">Facebook page URL</label><input className="input" value={form.facebookUrl} onChange={set("facebookUrl")} placeholder="https://facebook.com/..." /></div>
        <div><label className="label">Instagram URL</label><input className="input" value={form.instagramUrl} onChange={set("instagramUrl")} placeholder="https://instagram.com/..." /></div>
      </div>
      <button className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save settings"}</button>
    </form>
  );
}
