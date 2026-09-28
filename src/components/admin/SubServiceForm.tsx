"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Combobox } from "@/components/ui/Combobox";
import { useToast } from "@/components/ui/Toast";
import { safeFetch, readError } from "@/lib/safe-fetch";

type Service = { id: string; name: string };

export function SubServiceForm({
  subServiceId,
  initial,
}: {
  subServiceId?: string;
  initial?: Partial<{ name: string; serviceId: string; shortDesc: string; description: string; status: string; isFeatured: boolean; displayOrder: number }>;
}) {
  const router = useRouter();
  const toast = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    serviceId: initial?.serviceId ?? "",
    shortDesc: initial?.shortDesc ?? "",
    description: initial?.description ?? "",
    status: initial?.status ?? "DRAFT",
    isFeatured: initial?.isFeatured ?? false,
    displayOrder: initial?.displayOrder ?? 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then(setServices);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.serviceId) {
      setError("Please select a parent service.");
      return;
    }
    setSaving(true);
    setError(null);

    const url = subServiceId ? `/api/sub-services/${subServiceId}` : "/api/sub-services";
    const method = subServiceId ? "PATCH" : "POST";
    const res = await safeFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });

    setSaving(false);
    if (!res.ok) {
const msg = await readError(res);
      setError(msg);
      toast.error("Couldn't save sub-service", msg);
      return;
    }
    toast.success(subServiceId ? "Sub-service updated" : "Sub-service created");
    router.push("/admin/sub-services");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card max-w-2xl space-y-5 p-6">
      <div>
        <label className="label">Parent service *</label>
        <Combobox
          options={services.map((s) => ({ value: s.id, label: s.name }))}
          value={form.serviceId}
          onChange={(v) => setForm({ ...form, serviceId: v })}
          placeholder="Select a service"
          clearable={false}
        />
      </div>
      <div>
        <label className="label">Name *</label>
        <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <label className="label">Short description</label>
        <input className="input" value={form.shortDesc} onChange={(e) => setForm({ ...form, shortDesc: e.target.value })} />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
        Featured
      </label>

      {error && <p className="text-sm text-error">{error}</p>}
      <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Save sub-service"}</button>
    </form>
  );
}
