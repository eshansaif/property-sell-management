"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { useDebounced } from "@/components/ui/useDebounced";
import { safeFetch, readError } from "@/lib/safe-fetch";

type ListingOpt = { id: string; title: string; service: { name: string }; subService: { name: string } };
type Props = {
  id?: string;
  initial?: Partial<{ label: string; badge: string; listingId: string; listingTitle: string; customUrl: string; displayOrder: number; isActive: boolean }>;
};

export function PromoForm({ id, initial }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({
    label: initial?.label ?? "",
    badge: initial?.badge ?? "",
    listingId: initial?.listingId ?? "",
    customUrl: initial?.customUrl ?? "",
    displayOrder: initial?.displayOrder ?? 0,
    isActive: initial?.isActive ?? true,
  });
  const [selectedTitle, setSelectedTitle] = useState(initial?.listingTitle ?? "");
  const [search, setSearch] = useState("");
  const dsearch = useDebounced(search, 250);
  const [results, setResults] = useState<ListingOpt[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (form.listingId) return;
    let cancelled = false;
    (async () => {
      setSearching(true);
      const res = await safeFetch(`/api/promo?listings=1&q=${encodeURIComponent(dsearch)}`);
      if (!cancelled) {
        setResults(res.ok ? await res.json() : []);
        setSearching(false);
      }
    })();
    return () => { cancelled = true; };
  }, [dsearch, form.listingId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await safeFetch(id ? `/api/promo/${id}` : "/api/promo", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const msg = await readError(res);
      setError(msg);
      toast.error("Couldn't save promo", msg);
      return;
    }
    toast.success(id ? "Promo updated" : "Promo added");
    router.push("/admin/promo");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card max-w-xl space-y-5 p-6">
      <div>
        <label className="label">Link to a listing</label>
        {form.listingId ? (
          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-muted px-3 py-2 text-sm">
            <span className="truncate font-medium text-text-primary">{selectedTitle || "Selected listing"}</span>
            <button type="button" className="text-xs text-error hover:underline" onClick={() => { setForm({ ...form, listingId: "" }); setSelectedTitle(""); }}>Change</button>
          </div>
        ) : (
          <div>
            <input className="input" placeholder="Search published listings..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <ul className="mt-2 max-h-52 divide-y divide-border overflow-y-auto rounded-md border border-border">
              {searching && <li className="px-3 py-2 text-xs text-text-secondary">Searching...</li>}
              {!searching && results.length === 0 && <li className="px-3 py-2 text-xs text-text-secondary">No published listings found.</li>}
              {results.map((l) => (
                <li key={l.id}>
                  <button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-muted" onClick={() => { setForm({ ...form, listingId: l.id, customUrl: "" }); setSelectedTitle(l.title); }}>
                    <span className="font-medium text-text-primary">{l.title}</span>
                    <span className="block text-xs text-text-secondary">{l.service.name} › {l.subService.name}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-text-secondary">Or leave empty and use a custom link below.</p>
          </div>
        )}
      </div>

      {!form.listingId && (
        <div>
          <label className="label">Custom link</label>
          <input className="input" value={form.customUrl} onChange={(e) => setForm({ ...form, customUrl: e.target.value })} placeholder="https://... or /services/land" />
        </div>
      )}

      <div>
        <label className="label">Label {form.listingId ? "(optional — defaults to the listing title)" : "*"}</label>
        <input className="input" maxLength={120} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. 3-bedroom flat in Gulshan — now available" />
      </div>
      <div>
        <label className="label">Badge (optional)</label>
        <input className="input" maxLength={24} value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="e.g. New, Hot, Offer" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Display order</label>
          <input type="number" className="input" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} />
        </div>
        <label className="mt-6 flex items-center gap-2 text-sm text-text-primary">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Show in banner
        </label>
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
      <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Save promo"}</button>
    </form>
  );
}
