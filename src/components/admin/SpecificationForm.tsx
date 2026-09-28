"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Combobox } from "@/components/ui/Combobox";
import { useToast } from "@/components/ui/Toast";
import { safeFetch, readError } from "@/lib/safe-fetch";

type Option = { id: string; name: string };

const TYPES = [
  { value: "TEXT", label: "Text", hint: "Free text, e.g. Road name" },
  { value: "NUMBER", label: "Number", hint: "Plain number, e.g. Bedrooms" },
  { value: "MEASUREMENT", label: "Measurement", hint: "Number + unit, e.g. Area (sqft)" },
  { value: "CURRENCY", label: "Currency", hint: "Money amount" },
  { value: "BOOLEAN", label: "Yes / No", hint: "e.g. Furnished" },
  { value: "SELECT", label: "Single choice", hint: "Pick one from a list, e.g. Facing" },
  { value: "MULTI_SELECT", label: "Multiple choice", hint: "Pick several, e.g. Amenities" },
];

export function SpecificationForm({
  specId,
  initial,
}: {
  specId?: string;
  initial?: Partial<{
    serviceId: string;
    subServiceId: string;
    name: string;
    type: string;
    unit: string;
    options: string[];
    isRequired: boolean;
    isFilterable: boolean;
    displayOrder: number;
  }>;
}) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = !!specId;

  const [services, setServices] = useState<Option[]>([]);
  const [subServices, setSubServices] = useState<Option[]>([]);

  // Scope: attach to a whole service (applies to all its sub-services) or one sub-service.
  const [scope, setScope] = useState<"service" | "subService">(initial?.subServiceId ? "subService" : "service");
  const [parentServiceId, setParentServiceId] = useState(initial?.serviceId ?? "");
  const [subServiceId, setSubServiceId] = useState(initial?.subServiceId ?? "");

  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState(initial?.type ?? "TEXT");
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [options, setOptions] = useState<string[]>(initial?.options ?? []);
  const [optionInput, setOptionInput] = useState("");
  const [isRequired, setIsRequired] = useState(initial?.isRequired ?? false);
  const [isFilterable, setIsFilterable] = useState(initial?.isFilterable ?? false);
  const [displayOrder, setDisplayOrder] = useState(initial?.displayOrder ?? 0);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const needsOptions = type === "SELECT" || type === "MULTI_SELECT";
  const needsUnit = type === "MEASUREMENT" || type === "CURRENCY" || type === "NUMBER";

  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then(setServices);
  }, []);

  // Sub-services depend on the chosen service. In edit mode with a sub-service scope we
  // only know subServiceId initially, so derive the parent after loading all sub-services.
  useEffect(() => {
    if (!parentServiceId) { setSubServices([]); return; }
    fetch(`/api/sub-services?serviceId=${parentServiceId}`).then((r) => r.json()).then(setSubServices);
  }, [parentServiceId]);

  function addOption(raw: string) {
    const parts = raw.split(",").map((p) => p.replace(/\|/g, "").trim()).filter(Boolean);
    if (parts.length === 0) return;
    const next = [...options];
    for (const p of parts) if (!next.some((o) => o.toLowerCase() === p.toLowerCase())) next.push(p);
    setOptions(next);
    setOptionInput("");
  }

  function fail(msg: string) {
    setError(msg);
    toast.error("Please check the form", msg);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isEdit) {
      if (!parentServiceId) return fail("Please choose a service.");
      if (scope === "subService" && !subServiceId) return fail("Please choose a sub-service.");
    }
    if (needsOptions && options.length === 0) {
      return fail("Add at least one option for a choice-type specification.");
    }

    setSaving(true);

    const payload: any = {
      name,
      type,
      unit: needsUnit ? unit : "",
      options: needsOptions ? options : [],
      isRequired,
      isFilterable,
      displayOrder,
    };
    if (!isEdit) {
      if (scope === "subService") payload.subServiceId = subServiceId;
      else payload.serviceId = parentServiceId;
    }

    const res = await safeFetch(isEdit ? `/api/specifications/${specId}` : "/api/specifications", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (!res.ok) {
const msg = await readError(res);
      setError(msg);
      toast.error("Couldn't save specification", msg);
      return;
    }
    toast.success(isEdit ? "Specification updated" : "Specification created");
    router.push("/admin/specifications");
    router.refresh();
  }

  const typeHint = TYPES.find((t) => t.value === type)?.hint;

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      {/* Scope */}
      <div className="card space-y-4 p-6">
        <div>
          <h2 className="font-display text-lg text-text-primary">Where does it apply?</h2>
          <p className="mt-1 text-xs text-text-secondary">
            Attach it to a whole service (every sub-service under it gets this field) or to one specific sub-service.
          </p>
        </div>

        {isEdit ? (
          <p className="rounded-md bg-surface-muted px-3 py-2 text-xs text-text-secondary">
            The scope of an existing specification can't be changed. Create a new one if it should apply elsewhere.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {(["service", "subService"] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setScope(s)}
                  className={`rounded-md border px-3 py-2.5 text-left text-sm transition-colors ${
                    scope === s ? "border-primary bg-primary/5 text-text-primary" : "border-border text-text-secondary hover:bg-surface-muted"
                  }`}
                >
                  <span className="block font-medium">{s === "service" ? "Entire service" : "One sub-service"}</span>
                  <span className="block text-xs text-text-secondary">
                    {s === "service" ? "Shared across all its categories" : "Only for that category"}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Service *</label>
                <Combobox
                  options={services.map((s) => ({ value: s.id, label: s.name }))}
                  value={parentServiceId}
                  onChange={(v) => { setParentServiceId(v); setSubServiceId(""); }}
                  placeholder="Select a service"
                  clearable={false}
                />
              </div>
              {scope === "subService" && (
                <div>
                  <label className="label">Sub-service *</label>
                  <Combobox
                    options={subServices.map((s) => ({ value: s.id, label: s.name }))}
                    value={subServiceId}
                    onChange={setSubServiceId}
                    placeholder={parentServiceId ? "Select a sub-service" : "Select a service first"}
                    disabled={!parentServiceId}
                    clearable={false}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Definition */}
      <div className="card space-y-5 p-6">
        <h2 className="font-display text-lg text-text-primary">Field details</h2>

        <div>
          <label className="label">Name *</label>
          <input className="input" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bedrooms, Facing, Road width" />
        </div>

        <div>
          <label className="label">Field type *</label>
          <Combobox
            options={TYPES.map((t) => ({ value: t.value, label: t.label, sublabel: t.hint }))}
            value={type}
            onChange={setType}
            placeholder="Select a type"
            clearable={false}
          />
          {typeHint && <p className="mt-1.5 text-xs text-text-secondary">{typeHint}</p>}
        </div>

        {needsUnit && (
          <div>
            <label className="label">Unit (optional)</label>
            <input className="input" maxLength={30} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. sqft, katha, feet, BDT" />
            <p className="mt-1.5 text-xs text-text-secondary">Shown after the value on the public page, e.g. “1800 sqft”.</p>
          </div>
        )}

        {needsOptions && (
          <div>
            <label className="label">Options *</label>
            <div className="flex gap-2">
              <input
                className="input"
                value={optionInput}
                onChange={(e) => setOptionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addOption(optionInput); }
                }}
                placeholder="Type an option and press Enter (or paste comma-separated)"
              />
              <button type="button" className="btn-outline" onClick={() => addOption(optionInput)}>Add</button>
            </div>
            {options.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {options.map((o) => (
                  <li key={o} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted py-1 pl-3 pr-1.5 text-xs text-text-primary">
                    {o}
                    <button
                      type="button"
                      onClick={() => setOptions(options.filter((x) => x !== o))}
                      className="flex h-4 w-4 items-center justify-center rounded-full text-text-secondary hover:bg-border"
                      aria-label={`Remove ${o}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Behaviour */}
      <div className="card space-y-4 p-6">
        <h2 className="font-display text-lg text-text-primary">Behaviour</h2>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-0.5" checked={isFilterable} onChange={(e) => setIsFilterable(e.target.checked)} />
          <span>
            <span className="block font-medium text-text-primary">Use as a public filter</span>
            <span className="block text-xs text-text-secondary">Visitors can filter that category's listings by this field.</span>
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-0.5" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} />
          <span>
            <span className="block font-medium text-text-primary">Required</span>
            <span className="block text-xs text-text-secondary">Marked with * in the listing form.</span>
          </span>
        </label>
        <div className="max-w-[160px]">
          <label className="label">Display order</label>
          <input type="number" className="input" value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))} />
          <p className="mt-1.5 text-xs text-text-secondary">Lower numbers appear first.</p>
        </div>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : isEdit ? "Save changes" : "Create specification"}</button>
        <button type="button" onClick={() => router.push("/admin/specifications")} className="btn-outline">Cancel</button>
      </div>
    </form>
  );
}
