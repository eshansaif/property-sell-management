"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Service = { id: string; name: string };
type SubService = { id: string; name: string; serviceId: string };
type Spec = { id: string; name: string; type: string; unit: string | null; options: string[]; isRequired: boolean };

type InitialImage = { url: string; altText?: string | null };

export function ListingForm({
  listingId,
  initial,
}: {
  listingId?: string;
  initial?: Partial<{
    serviceId: string; subServiceId: string; title: string; shortDesc: string; description: string;
    priceLabel: string; location: string; status: string; isFeatured: boolean;
    specValues: Record<string, string>; images: InitialImage[];
  }>;
}) {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [subServices, setSubServices] = useState<SubService[]>([]);
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>(initial?.images?.map((i) => i.url) ?? [""]);

  const [form, setForm] = useState({
    serviceId: initial?.serviceId ?? "",
    subServiceId: initial?.subServiceId ?? "",
    title: initial?.title ?? "",
    shortDesc: initial?.shortDesc ?? "",
    description: initial?.description ?? "",
    priceLabel: initial?.priceLabel ?? "",
    location: initial?.location ?? "",
    status: initial?.status ?? "DRAFT",
    isFeatured: initial?.isFeatured ?? false,
  });
  const [specValues, setSpecValues] = useState<Record<string, string>>(initial?.specValues ?? {});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then(setServices);
  }, []);

  useEffect(() => {
    if (!form.serviceId) { setSubServices([]); return; }
    fetch(`/api/sub-services?serviceId=${form.serviceId}`).then((r) => r.json()).then(setSubServices);
  }, [form.serviceId]);

  useEffect(() => {
    if (!form.subServiceId) { setSpecs([]); return; }
    fetch(`/api/specifications?subServiceId=${form.subServiceId}`).then((r) => r.json()).then(setSpecs);
  }, [form.subServiceId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.serviceId || !form.subServiceId) {
      setError("Please select a service and sub-service.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = { ...form, specs: specValues };
    const url = listingId ? `/api/listings/${listingId}` : "/api/listings";
    const method = listingId ? "PATCH" : "POST";

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong.");
      setSaving(false);
      return;
    }
    const listing = await res.json();

    // Sync images (replace-all: simple + reliable for admin use)
    const validUrls = imageUrls.map((u) => u.trim()).filter(Boolean);
    if (validUrls.length > 0) {
      await fetch(`/api/listings/${listing.id}/images`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: validUrls }),
      });
    }

    setSaving(false);
    router.push("/admin/listings");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
      <div className="card space-y-5 p-6">
        <h2 className="font-display text-lg text-text-primary">Basic information</h2>
        <div>
          <label className="label">Title *</label>
          <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Service *</label>
            <select className="input" required value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value, subServiceId: "" })}>
              <option value="">Select a service</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Sub-service *</label>
            <select className="input" required disabled={!form.serviceId} value={form.subServiceId} onChange={(e) => setForm({ ...form, subServiceId: e.target.value })}>
              <option value="">Select a sub-service</option>
              {subServices.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Price / rate label</label>
            <input className="input" placeholder="e.g. ৳55,000 / month" value={form.priceLabel} onChange={(e) => setForm({ ...form, priceLabel: e.target.value })} />
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Short description</label>
          <input className="input" value={form.shortDesc} onChange={(e) => setForm({ ...form, shortDesc: e.target.value })} />
        </div>
        <div>
          <label className="label">Full description</label>
          <textarea className="input" rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
      </div>

      {specs.length > 0 && (
        <div className="card space-y-4 p-6">
          <h2 className="font-display text-lg text-text-primary">Specifications</h2>
          <p className="text-xs text-text-secondary">These fields come from the sub-service's specification definitions — add more anytime without changing code.</p>
          <div className="grid grid-cols-2 gap-4">
            {specs.map((s) => (
              <div key={s.id}>
                <label className="label">{s.name}{s.unit ? ` (${s.unit})` : ""}{s.isRequired ? " *" : ""}</label>
                {s.type === "BOOLEAN" ? (
                  <select className="input" value={specValues[s.id] ?? ""} onChange={(e) => setSpecValues({ ...specValues, [s.id]: e.target.value })}>
                    <option value="">—</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                ) : s.type === "SELECT" ? (
                  <select className="input" value={specValues[s.id] ?? ""} onChange={(e) => setSpecValues({ ...specValues, [s.id]: e.target.value })}>
                    <option value="">—</option>
                    {s.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    className="input"
                    type={s.type === "NUMBER" || s.type === "MEASUREMENT" || s.type === "CURRENCY" ? "number" : "text"}
                    value={specValues[s.id] ?? ""}
                    onChange={(e) => setSpecValues({ ...specValues, [s.id]: e.target.value })}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card space-y-4 p-6">
        <h2 className="font-display text-lg text-text-primary">Images</h2>
        <p className="text-xs text-text-secondary">Paste image URLs (first one is used as the cover). Connect object storage for direct upload later.</p>
        {imageUrls.map((url, i) => (
          <div key={i} className="flex gap-2">
            <input
              className="input"
              placeholder="https://..."
              value={url}
              onChange={(e) => {
                const next = [...imageUrls];
                next[i] = e.target.value;
                setImageUrls(next);
              }}
            />
            <button type="button" className="btn-outline !px-3" onClick={() => setImageUrls(imageUrls.filter((_, idx) => idx !== i))}>Remove</button>
          </div>
        ))}
        <button type="button" className="btn-outline" onClick={() => setImageUrls([...imageUrls, ""])}>Add image</button>
      </div>

      <div className="card space-y-4 p-6">
        <h2 className="font-display text-lg text-text-primary">Publishing</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <label className="mt-6 flex items-center gap-2 text-sm text-text-primary">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
            Featured
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}
      <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Save listing"}</button>
    </form>
  );
}
