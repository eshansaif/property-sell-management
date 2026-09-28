"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Combobox } from "@/components/ui/Combobox";
import { useToast } from "@/components/ui/Toast";
import { safeFetch, readError } from "@/lib/safe-fetch";

type Props = {
  serviceId?: string;
  initial?: Partial<{
    name: string; shortDesc: string; description: string; coverImage: string;
    status: string; isFeatured: boolean; seoTitle: string; seoDescription: string; displayOrder: number;
  }>;
};

export function ServiceForm({ serviceId, initial }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    shortDesc: initial?.shortDesc ?? "",
    description: initial?.description ?? "",
    coverImage: initial?.coverImage ?? "",
    status: initial?.status ?? "DRAFT",
    isFeatured: initial?.isFeatured ?? false,
    seoTitle: initial?.seoTitle ?? "",
    seoDescription: initial?.seoDescription ?? "",
    displayOrder: initial?.displayOrder ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const url = serviceId ? `/api/services/${serviceId}` : "/api/services";
    const method = serviceId ? "PATCH" : "POST";

    const res = await safeFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
    if (!res.ok) {
const msg = await readError(res);
      setError(msg);
      toast.error("Couldn't save service", msg);
      return;
    }
    toast.success(serviceId ? "Service updated" : "Service created");
    router.push("/admin/services");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card max-w-2xl space-y-5 p-6">
      <div>
        <label className="label">Name *</label>
        <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <label className="label">Short description</label>
        <input className="input" value={form.shortDesc} onChange={(e) => setForm({ ...form, shortDesc: e.target.value })} />
      </div>
      <div>
        <label className="label">Full description</label>
        <textarea className="input" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div>
        <label className="label">Cover image URL</label>
        <input className="input" value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} placeholder="https://..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Status</label>
          <Combobox
            options={[
              { value: "DRAFT", label: "Draft" },
              { value: "PUBLISHED", label: "Published" },
              { value: "ARCHIVED", label: "Archived" },
            ]}
            value={form.status}
            onChange={(v) => setForm({ ...form, status: v })}
            placeholder="Status"
            clearable={false}
          />
        </div>
        <div>
          <label className="label">Display order</label>
          <input type="number" className="input" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-text-primary">
        <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
        Featured on homepage
      </label>

      <fieldset className="rounded-md border border-border p-4">
        <legend className="px-1 text-xs font-medium text-text-secondary">SEO</legend>
        <div className="space-y-3">
          <div>
            <label className="label">SEO title</label>
            <input className="input" value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} />
          </div>
          <div>
            <label className="label">SEO description</label>
            <input className="input" value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} />
          </div>
        </div>
      </fieldset>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Save service"}</button>
      </div>
    </form>
  );
}
