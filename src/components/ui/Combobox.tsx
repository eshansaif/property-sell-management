"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type ComboboxOption = { value: string; label: string; sublabel?: string };

/**
 * A dependency-free searchable dropdown. Type to filter, arrow keys to
 * navigate, Enter to select, Escape to close. Used everywhere a plain
 * <select> would otherwise be used with more than a handful of options.
 */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Search...",
  disabled = false,
  clearable = true,
}: {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.sublabel?.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function selectOption(opt: ComboboxOption) {
    onChange(opt.value);
    setOpen(false);
    setQuery("");
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlighted]) selectOption(filtered[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setOpen((o) => !o);
          setHighlighted(0);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="input flex items-center justify-between text-left disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={selected ? "text-text-primary" : "text-text-secondary/70"}>
          {selected ? selected.label : placeholder}
        </span>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="shrink-0 text-text-secondary">
          <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-border bg-surface shadow-lg">
          <div className="border-b border-border p-2">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setHighlighted(0); }}
              onKeyDown={onKeyDown}
              placeholder="Type to search..."
              className="w-full rounded border-none bg-surface-muted px-3 py-1.5 text-sm outline-none"
            />
          </div>
          <ul role="listbox" className="max-h-56 overflow-y-auto py-1">
            {clearable && (
              <li
                onClick={() => selectOption({ value: "", label: placeholder })}
                className="cursor-pointer px-3 py-2 text-sm text-text-secondary hover:bg-surface-muted"
              >
                — None —
              </li>
            )}
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-text-secondary">No matches</li>
            )}
            {filtered.map((opt, i) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                onClick={() => selectOption(opt)}
                onMouseEnter={() => setHighlighted(i)}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  i === highlighted ? "bg-accent/10 text-accent" : "text-text-primary"
                } ${opt.value === value ? "font-medium" : ""}`}
              >
                {opt.label}
                {opt.sublabel && <span className="ml-1.5 text-xs text-text-secondary">{opt.sublabel}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
