"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Combobox } from "@/components/ui/Combobox";
import { ImageUploader, type UploadedImage } from "@/components/admin/ImageUploader";
import { encodeMulti, decodeMulti } from "@/lib/spec-values";
import { CustomSpecsEditor, flattenSections, sectionsFromFlat, validateSections, type FlatSpec, type SpecSection } from "@/components/admin/CustomSpecsEditor";
import { useToast } from "@/components/ui/Toast";
import { safeFetch, readError } from "@/lib/safe-fetch";

type Service = { id: string; name: string };
type SubService = { id: string; name: string; serviceId: string };
type Spec = { id: string; name: string; type: string; unit: string | null; options: string[]; isRequired: boolean };

let idCounter = 0;
const nextId = () => `img-${Date.now()}-${idCounter++}`;

export function ListingForm({
  listingId,
  initial,
}: {
  listingId?: string;
  initial?: Partial<{
    serviceId: string; subServiceId: string; title: string; shortDesc: string; description: string;
    priceLabel: string; location: string; status: string; isFeatured: boolean;
    specValues: Record<string, string>; images: { url: string }[]; customSpecs: FlatSpec[];
  }>;
}) {
  const router = useRouter();
  const toast = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [subServices, setSubServices] = useState<SubService[]>([]);
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [images, setImages] = useState<UploadedImage[]>(
    initial?.images?.map((i) => ({ id: nextId(), url: i.url })) ?? []
  );

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
  const [sections, setSections] = useState<SpecSection[]>(() => sectionsFromFlat(initial?.customSpecs ?? []));
  const [labelSuggestions, setLabelSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then(setServices);
  }, []);

  useEffect(() => {
    fetch("/api/custom-spec-labels")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => Array.isArray(d) && setLabelSuggestions(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.serviceId) { setSubServices([]); return; }
    fetch(`/api/sub-services?serviceId=${form.serviceId}`).then((r) => r.json()).then(setSubServices);
  }, [form.serviceId]);

  useEffect(() => {
    if (!form.subServiceId) { setSpecs([]); return; }
    fetch(`/api/specifications?subServiceId=${form.subServiceId}`).then((r) => r.json()).then(setSpecs);
  }, [form.subServiceId]);

  const stillUploading = images.some((i) => i.uploading);

  function fail(msg: string) {
    setError(msg);
    toast.error("Couldn't save listing", msg);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.serviceId || !form.subServiceId) {
      fail("Please select a service and sub-service.");
      return;
    }
    if (stillUploading) {
      fail("Please wait for image uploads to finish.");
      return;
    }
    if (form.status === "PUBLISHED") {
      const missing = specs.filter((sp) => sp.isRequired && !(specValues[sp.id] ?? "").trim());
      if (missing.length > 0) {
        fail(`Please fill the required specification${missing.length > 1 ? "s" : ""}: ${missing.map((m) => m.name).join(", ")}.`);
        return;
      }
    }
    const sectionError = validateSections(sections);
    if (sectionError) return fail(sectionError);

    setSaving(true);
    setError(null);

    const payload = { ...form, specs: specValues, customSpecs: flattenSections(sections) };
    const url = listingId ? `/api/listings/${listingId}` : "/api/listings";
    const method = listingId ? "PATCH" : "POST";

    const res = await safeFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) {
      fail(await readError(res));
      setSaving(false);
      return;
    }
    const listing = await res.json();

    const validUrls = images.filter((i) => i.url && !i.error).map((i) => i.url);
    let imagesFailed = false;
    if (validUrls.length > 0) {
      const imgRes = await safeFetch(`/api/listings/${listing.id}/images`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: validUrls }),
      });
      imagesFailed = !imgRes.ok;
    }

    setSaving(false);
    if (imagesFailed) toast.error("Listing saved, but images failed to save", "Open the listing and re-add the images.");
    else toast.success(listingId ? "Listing updated" : "Listing created", form.status === "PUBLISHED" ? "It is now live on the public site." : "Saved as " + form.status.toLowerCase() + ".");
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
            <Combobox
              options={services.map((s) => ({ value: s.id, label: s.name }))}
              value={form.serviceId}
              onChange={(v) => setForm({ ...form, serviceId: v, subServiceId: "" })}
              placeholder="Select a service"
              clearable={false}
            />
          </div>
          <div>
            <label className="label">Sub-service *</label>
            <Combobox
              options={subServices.map((s) => ({ value: s.id, label: s.name }))}
              value={form.subServiceId}
              onChange={(v) => setForm({ ...form, subServiceId: v })}
              placeholder={form.serviceId ? "Select a sub-service" : "Select a service first"}
              disabled={!form.serviceId}
              clearable={false}
            />
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
              <div key={s.id} className={s.type === "MULTI_SELECT" ? "col-span-2" : ""}>
                <label className="label">{s.name}{s.unit && s.type !== "CURRENCY" ? ` (${s.unit})` : ""}{s.type === "CURRENCY" && s.unit ? ` (${s.unit})` : ""}{s.isRequired ? " *" : ""}</label>
                {s.type === "BOOLEAN" ? (
                  <Combobox
                    options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]}
                    value={specValues[s.id] ?? ""}
                    onChange={(v) => setSpecValues({ ...specValues, [s.id]: v })}
                    placeholder="—"
                  />
                ) : s.type === "SELECT" ? (
                  <Combobox
                    options={s.options.map((o) => ({ value: o, label: o }))}
                    value={specValues[s.id] ?? ""}
                    onChange={(v) => setSpecValues({ ...specValues, [s.id]: v })}
                    placeholder="—"
                  />
                ) : s.type === "MULTI_SELECT" ? (
                  <div className="flex flex-wrap gap-2">
                    {s.options.map((o) => {
                      const selected = decodeMulti(specValues[s.id] ?? "");
                      const on = selected.includes(o);
                      return (
                        <button
                          type="button"
                          key={o}
                          aria-pressed={on}
                          onClick={() => {
                            const next = on ? selected.filter((x) => x !== o) : [...selected, o];
                            setSpecValues({ ...specValues, [s.id]: encodeMulti(next) });
                          }}
                          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                            on ? "border-primary bg-primary text-primary-foreground" : "border-border text-text-secondary hover:bg-surface-muted"
                          }`}
                        >
                          {o}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <input
                    className="input"
                    type={s.type === "NUMBER" || s.type === "MEASUREMENT" || s.type === "CURRENCY" ? "number" : "text"}
                    step="any"
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
        <div>
          <h2 className="font-display text-lg text-text-primary">Additional details</h2>
          <p className="mt-1 text-xs text-text-secondary">
            Add as many “label: value” rows as you need — ownership, floor, nearby places, anything. Group rows under section titles if you like.
            Visitors see them as a clean specification table.
          </p>
        </div>
        <CustomSpecsEditor sections={sections} onChange={setSections} suggestions={labelSuggestions} />
      </div>

      <div className="card space-y-4 p-6">
        <h2 className="font-display text-lg text-text-primary">Images</h2>
        <ImageUploader images={images} onChange={setImages} />
      </div>

      <div className="card space-y-4 p-6">
        <h2 className="font-display text-lg text-text-primary">Publishing</h2>
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
          <label className="mt-6 flex items-center gap-2 text-sm text-text-primary">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
            Featured
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}
      <button type="submit" disabled={saving || stillUploading} className="btn-primary">
        {saving ? "Saving..." : stillUploading ? "Uploading images..." : "Save listing"}
      </button>
    </form>
  );
}
