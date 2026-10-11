"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SingleImageUploader } from "@/components/admin/SingleImageUploader";
import { useToast } from "@/components/ui/Toast";
import { safeFetch, readError } from "@/lib/safe-fetch";

type Props = {
  clientId?: string;
  initial?: Partial<{ name: string; logoUrl: string; websiteUrl: string; displayOrder: number; isActive: boolean }>;
};

export function ClientForm({ clientId, initial }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    logoUrl: initial?.logoUrl ?? "",
    websiteUrl: initial?.websiteUrl ?? "",
    displayOrder: initial?.displayOrder ?? 0,
    isActive: initial?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.logoUrl) {
      setError("Please upload a logo.");
      return;
    }
    setSaving(true);
    setError(null);

    const url = clientId ? `/api/clients/${clientId}` : "/api/clients";
    const method = clientId ? "PATCH" : "POST";

    const res = await safeFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });

    setSaving(false);
    if (!res.ok) {
      const msg = await readError(res);
      setError(msg);
      toast.error("Couldn't save client", msg);
      return;
    }
    toast.success(clientId ? "Client updated" : "Client added");
    router.push("/admin/clients");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card max-w-xl space-y-5 p-6">
      <div>
        <SingleImageUploader
          label="Logo *"
          helpText="A clean logo on a transparent or white background works best. Square or wide both work."
          aspect="aspect-square"
          value={form.logoUrl}
          onChange={(v) => setForm({ ...form, logoUrl: v })}
        />
      </div>
      <div>
        <label className="label">Client / company name *</label>
        <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Used as alt text for the logo" />
      </div>
      <div>
        <label className="label">Website link (optional)</label>
        <input className="input" value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} placeholder="https://..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Display order</label>
          <input type="number" className="input" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} />
        </div>
        <label className="mt-6 flex items-center gap-2 text-sm text-text-primary">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Show on homepage
        </label>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}
      <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Save client"}</button>
    </form>
  );
}
