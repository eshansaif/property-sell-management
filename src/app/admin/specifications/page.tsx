"use client";

import { useToast } from "@/components/ui/Toast";
import { safeFetch, readError } from "@/lib/safe-fetch";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";
import { Combobox } from "@/components/ui/Combobox";

type Spec = {
  id: string;
  name: string;
  type: string;
  unit: string | null;
  options: string[];
  isRequired: boolean;
  isFilterable: boolean;
  displayOrder: number;
  service: { name: string } | null;
  subService: { name: string; service: { name: string } } | null;
  _count: { values: number };
};
type Option = { id: string; name: string };

const TYPE_LABELS: Record<string, string> = {
  TEXT: "Text",
  NUMBER: "Number",
  MEASUREMENT: "Measurement",
  CURRENCY: "Currency",
  BOOLEAN: "Yes / No",
  SELECT: "Single choice",
  MULTI_SELECT: "Multiple choice",
};

export default function AdminSpecificationsPage() {
  const toast = useToast();
  const [items, setItems] = useState<Spec[] | null>(null);
  const [services, setServices] = useState<Option[]>([]);
  const [subServices, setSubServices] = useState<Option[]>([]);
  const [q, setQ] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [subServiceId, setSubServiceId] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then(setServices);
  }, []);

  useEffect(() => {
    if (!serviceId) { setSubServices([]); return; }
    fetch(`/api/sub-services?serviceId=${serviceId}`).then((r) => r.json()).then(setSubServices);
  }, [serviceId]);

  const load = useCallback(async (query: string, svc: string, sub: string, p: number) => {
    setItems(null);
    const params = new URLSearchParams({ admin: "1", page: String(p) });
    if (query) params.set("q", query);
    if (svc) params.set("serviceId", svc);
    if (sub) params.set("subServiceId", sub);
    const res = await safeFetch(`/api/specifications?${params.toString()}`);
    if (!res.ok) {
      toast.error("Couldn't load specifications", await readError(res));
      setItems([]);
      return;
    }
    const data = await res.json();
    setItems(data.items ?? []);
    setTotal(data.total ?? 0);
  }, []);

  useEffect(() => { load(q, serviceId, subServiceId, page); }, [page, serviceId, subServiceId, load]); // eslint-disable-line react-hooks/exhaustive-deps

  function onSearchChange(value: string) {
    setQ(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); load(value, serviceId, subServiceId, 1); }, 350);
  }

  async function handleDelete(spec: Spec) {
    const warn = spec._count.values > 0
      ? `“${spec.name}” is used by ${spec._count.values} listing value(s). Deleting it removes those values too. Continue?`
      : `Delete “${spec.name}”?`;
    if (!confirm(warn)) return;
    const res = await safeFetch(`/api/specifications/${spec.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Couldn't delete specification", await readError(res));
      return;
    }
    const result = await res.json().catch(() => ({}));
    if (result.archived) toast.info("Specification archived", "It is in use, so it was archived instead of deleted.");
    else toast.success("Specification deleted");
    load(q, serviceId, subServiceId, page);
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-text-primary">Specifications</h1>
        <Link href="/admin/specifications/new" className="btn-primary">New specification</Link>
      </div>
      <p className="mb-6 max-w-2xl text-sm text-text-secondary">
        Define the fields listings can have — bedrooms, facing, area, amenities, anything. Attach them to a whole
        service or one sub-service, and they appear automatically in the listing form and on the public listing page.
      </p>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <input className="input" placeholder="Search specifications..." value={q} onChange={(e) => onSearchChange(e.target.value)} />
        <Combobox
          options={services.map((s) => ({ value: s.id, label: s.name }))}
          value={serviceId}
          onChange={(v) => { setServiceId(v); setSubServiceId(""); setPage(1); }}
          placeholder="All services"
        />
        <Combobox
          options={subServices.map((s) => ({ value: s.id, label: s.name }))}
          value={subServiceId}
          onChange={(v) => { setSubServiceId(v); setPage(1); }}
          placeholder={serviceId ? "All sub-services" : "Pick a service first"}
          disabled={!serviceId}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-surface-muted text-left text-xs text-text-secondary">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Applies to</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Options / unit</th>
                <th className="px-4 py-3">Flags</th>
                <th className="px-4 py-3">Used</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items === null && <TableSkeleton rows={6} cols={7} />}
              {items?.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-text-secondary">
                    No specifications yet. Create one to add custom fields to your listings.
                  </td>
                </tr>
              )}
              {items?.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium text-text-primary">{s.name}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {s.subService ? `${s.subService.service.name} / ${s.subService.name}` : s.service ? `${s.service.name} (all)` : "—"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{TYPE_LABELS[s.type] ?? s.type}</td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-text-secondary">
                    {s.options.length > 0 ? s.options.join(", ") : s.unit || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {s.isFilterable && <span className="badge bg-info/10 text-info">Filter</span>}
                      {s.isRequired && <span className="badge bg-warning/10 text-warning">Required</span>}
                      {!s.isFilterable && !s.isRequired && <span className="text-text-secondary">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{s._count.values}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Link href={`/admin/specifications/${s.id}/edit`} className="mr-3 text-accent hover:underline">Edit</Link>
                    <button onClick={() => handleDelete(s)} className="text-error hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </div>
  );
}
