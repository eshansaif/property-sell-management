"use client";

import { useId, useState } from "react";

export type SpecRow = { id: string; label: string; value: string };
export type SpecSection = { id: string; title: string; rows: SpecRow[] };
export type FlatSpec = { group: string; label: string; value: string };

let n = 0;
const uid = () => `r${Date.now().toString(36)}${n++}`;
const newRow = (label = ""): SpecRow => ({ id: uid(), label, value: "" });
const newSection = (): SpecSection => ({ id: uid(), title: "", rows: [newRow()] });

export function sectionsFromFlat(flat: FlatSpec[]): SpecSection[] {
  if (!flat.length) return [{ id: uid(), title: "", rows: [] }];
  const order: string[] = [];
  const map = new Map<string, SpecRow[]>();
  for (const f of flat) {
    if (!map.has(f.group)) { map.set(f.group, []); order.push(f.group); }
    map.get(f.group)!.push({ id: uid(), label: f.label, value: f.value });
  }
  return order.map((g) => ({ id: uid(), title: g, rows: map.get(g)! }));
}

export function flattenSections(sections: SpecSection[]): FlatSpec[] {
  const out: FlatSpec[] = [];
  for (const s of sections)
    for (const r of s.rows) {
      if (!r.label.trim() && !r.value.trim()) continue;
      out.push({ group: s.title.trim(), label: r.label.trim(), value: r.value.trim() });
    }
  return out;
}

export function validateSections(sections: SpecSection[]): string | null {
  for (const s of sections)
    for (const r of s.rows) {
      const hasL = !!r.label.trim(), hasV = !!r.value.trim();
      if (hasL !== hasV) return "Every additional-detail row needs both a label and a value (or remove the empty row).";
    }
  return null;
}

export function CustomSpecsEditor({
  sections,
  onChange,
  suggestions,
}: {
  sections: SpecSection[];
  onChange: (s: SpecSection[]) => void;
  suggestions: string[];
}) {
  const listId = useId();
  const [focus, setFocus] = useState<{ id: string; field: "label" | "value" } | null>(null);

  const used = new Set(sections.flatMap((s) => s.rows.map((r) => r.label.trim().toLowerCase())));
  const chips = suggestions.filter((s) => !used.has(s.toLowerCase())).slice(0, 10);
  const totalRows = sections.reduce((a, s) => a + s.rows.length, 0);

  const patchSection = (id: string, fn: (s: SpecSection) => SpecSection) => onChange(sections.map((s) => (s.id === id ? fn(s) : s)));

  function addRow(sectionId: string, afterRowId?: string, label = "") {
    const row = newRow(label);
    patchSection(sectionId, (s) => {
      const rows = [...s.rows];
      const idx = afterRowId ? rows.findIndex((r) => r.id === afterRowId) : rows.length - 1;
      rows.splice(idx + 1, 0, row);
      return { ...s, rows };
    });
    setFocus({ id: row.id, field: label ? "value" : "label" });
  }

  function move(sectionId: string, rowId: string, dir: -1 | 1) {
    patchSection(sectionId, (s) => {
      const rows = [...s.rows];
      const i = rows.findIndex((r) => r.id === rowId);
      const j = i + dir;
      if (j < 0 || j >= rows.length) return s;
      [rows[i], rows[j]] = [rows[j], rows[i]];
      return { ...s, rows };
    });
  }

  return (
    <div>
      <datalist id={listId}>{suggestions.map((s) => <option key={s} value={s} />)}</datalist>

      <div className="space-y-5">
        {sections.map((section, si) => (
          <div key={section.id} className="rounded-lg border border-border">
            <div className="flex items-center gap-2 border-b border-border bg-surface-muted/60 px-3 py-2">
              <input
                className="w-full bg-transparent text-sm font-medium text-text-primary outline-none placeholder:font-normal placeholder:text-text-secondary/70"
                placeholder={si === 0 ? "Section title (optional) — e.g. Building details" : "Section title — e.g. Legal & documents"}
                aria-label="Section title"
                maxLength={60}
                value={section.title}
                onChange={(e) => patchSection(section.id, (s) => ({ ...s, title: e.target.value }))}
              />
              {sections.length > 1 && (
                <button
                  type="button"
                  onClick={() => onChange(sections.filter((s) => s.id !== section.id))}
                  className="shrink-0 text-xs text-error hover:underline"
                >
                  Remove section
                </button>
              )}
            </div>

            <div className="space-y-2 p-3">
              {section.rows.length === 0 && <p className="py-2 text-center text-xs text-text-secondary">No rows yet.</p>}
              {section.rows.map((row, ri) => (
                <div
                  key={row.id}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center"
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" || !(e.target instanceof HTMLInputElement)) return;
                    e.preventDefault(); // never submit the whole listing form from a spec row
                    if (e.target.dataset.role === "label") {
                      (e.currentTarget.querySelector('[data-role="value"]') as HTMLInputElement | null)?.focus();
                    } else {
                      addRow(section.id, row.id);
                    }
                  }}
                >
                  <input
                    data-role="label"
                    className="input sm:w-2/5"
                    list={listId}
                    placeholder="Label (e.g. Ownership)"
                    aria-label="Specification label"
                    maxLength={80}
                    autoFocus={focus?.id === row.id && focus.field === "label"}
                    value={row.label}
                    onChange={(e) => patchSection(section.id, (s) => ({ ...s, rows: s.rows.map((r) => (r.id === row.id ? { ...r, label: e.target.value } : r)) }))}
                  />
                  <input
                    data-role="value"
                    className="input sm:flex-1"
                    placeholder="Value (e.g. Freehold)"
                    aria-label="Specification value"
                    maxLength={500}
                    autoFocus={focus?.id === row.id && focus.field === "value"}
                    value={row.value}
                    onChange={(e) => patchSection(section.id, (s) => ({ ...s, rows: s.rows.map((r) => (r.id === row.id ? { ...r, value: e.target.value } : r)) }))}
                  />
                  <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
                    <button type="button" onClick={() => move(section.id, row.id, -1)} disabled={ri === 0} aria-label="Move row up" className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-text-secondary hover:bg-surface-muted disabled:opacity-30">↑</button>
                    <button type="button" onClick={() => move(section.id, row.id, 1)} disabled={ri === section.rows.length - 1} aria-label="Move row down" className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-text-secondary hover:bg-surface-muted disabled:opacity-30">↓</button>
                    <button
                      type="button"
                      onClick={() => patchSection(section.id, (s) => ({ ...s, rows: s.rows.filter((r) => r.id !== row.id) }))}
                      aria-label="Remove row"
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-error hover:bg-error/5"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addRow(section.id)} className="btn-outline !py-1.5 text-xs">+ Add row</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => onChange([...sections, newSection()])} className="text-sm font-medium text-accent hover:underline">
          + Add another section
        </button>
        <span className="text-xs text-text-secondary">{totalRows} row{totalRows === 1 ? "" : "s"}</span>
      </div>

      {chips.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs text-text-secondary">Quick add a commonly used label:</p>
          <div className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => addRow(sections[sections.length - 1].id, undefined, c)}
                className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent"
              >
                + {c}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
