// Isomorphic helpers (safe in server + client components) for how specification
// values are stored in ListingSpecificationValue.value (always a string) and how
// they're shown to visitors. Keeping this in one place means the listing form,
// public listing page, filters and structured data all agree.

export type SpecType = "TEXT" | "NUMBER" | "BOOLEAN" | "SELECT" | "MULTI_SELECT" | "CURRENCY" | "MEASUREMENT";

/** Multi-select values are stored as "|A|B|C|" so exact-match filtering can use `contains "|A|"`. */
export function encodeMulti(values: string[]): string {
  const clean = values.map((v) => v.replace(/\|/g, "").trim()).filter(Boolean);
  return clean.length ? `|${clean.join("|")}|` : "";
}

export function decodeMulti(stored: string): string[] {
  return stored.split("|").map((v) => v.trim()).filter(Boolean);
}

function formatNumber(value: string): string {
  const n = Number(value);
  return Number.isFinite(n) ? new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n) : value;
}

/** Plain-text rendering (used for filters, JSON-LD, meta). */
export function formatSpecText(type: SpecType | string, value: string, unit?: string | null): string {
  switch (type) {
    case "BOOLEAN":
      return value === "true" ? "Yes" : value === "false" ? "No" : value;
    case "MULTI_SELECT":
      return decodeMulti(value).join(", ");
    case "CURRENCY":
      return unit ? `${unit} ${formatNumber(value)}` : formatNumber(value);
    case "NUMBER":
    case "MEASUREMENT":
      return unit ? `${formatNumber(value)} ${unit}` : formatNumber(value);
    default:
      return value;
  }
}
