"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SingleImageUploader } from "@/components/admin/SingleImageUploader";
import { useToast } from "@/components/ui/Toast";
import { safeFetch, readError } from "@/lib/safe-fetch";

type Props = {
  id?: string;
  initial?: Partial<{ authorName: string; authorRole: string; authorPhoto: string; content: string; rating: number | null; displayOrder: number; isActive: boolean }>;
};

export function TestimonialForm({ id, initial }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<{
  authorName: string; authorRole: string; authorPhoto: string; content: string;
  rating: number | null; displayOrder: number; isActive: boolean;
}>({
  authorName: initial?.authorName ?? "",
  authorRole: initial?.authorRole ?? "",
  authorPhoto: initial?.authorPhoto ?? "",
  content: initial?.content ?? "",
  rating: initial?.rating === undefined ? 5 : initial.rating,
  displayOrder: initial?.displayOrder ?? 0,
  isActive: initial?.isActive ?? true,
});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await safeFetch(id ? `/api/testimonials/${id}` : "/api/testimonials", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const msg = await readError(res);
      setError(msg);
      toast.error("Couldn't save testimonial", msg);
      return;
    }
    toast.success(id ? "Testimonial updated" : "Testimonial added");
    router.push("/admin/testimonials");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card max-w-xl space-y-5 p-6">
      <div>
        <label className="label">Name *</label>
        <input className="input" required maxLength={100} value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} />
      </div>
      <div>
        <label className="label">Role / company (optional)</label>
        <input className="input" maxLength={100} value={form.authorRole} onChange={(e) => setForm({ ...form, authorRole: e.target.value })} placeholder="e.g. Home buyer, Dhaka" />
      </div>
      <div>
        <label className="label">Testimonial *</label>
        <textarea className="input" rows={5} required minLength={10} maxLength={1000} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        <p className="mt-1 text-xs text-text-secondary">{form.content.length}/1000</p>
      </div>
      <SingleImageUploader label="Photo (optional)" helpText="A square photo works best. If empty, the first letter of the name is shown." aspect="aspect-square" value={form.authorPhoto} onChange={(v) => setForm({ ...form, authorPhoto: v })} />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Rating</label>
          <select className="input" value={form.rating ?? ""} onChange={(e) => setForm({ ...form, rating: e.target.value ? Number(e.target.value) : null })}>
            <option value="">No rating</option>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Display order</label>
          <input type="number" className="input" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-text-primary">
        <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
        Show on homepage
      </label>
      {error && <p className="text-sm text-error">{error}</p>}
      <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Save testimonial"}</button>
    </form>
  );
}
