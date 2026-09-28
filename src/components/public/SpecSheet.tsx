import { decodeMulti, formatSpecText } from "@/lib/spec-values";

export type SpecRowView = { key: string; label: string; content: React.ReactNode };

export function SpecValue({ type, value, unit }: { type: string; value: string; unit?: string | null }) {
  if (type === "MULTI_SELECT") {
    return (
      <ul className="flex flex-wrap gap-1.5">
        {decodeMulti(value).map((v) => (
          <li key={v} className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs">{v}</li>
        ))}
      </ul>
    );
  }
  if (type === "BOOLEAN") {
    return <span className={value === "true" ? "text-success" : "text-text-secondary"}>{value === "true" ? "✓ Yes" : "✕ No"}</span>;
  }
  return <>{formatSpecText(type, value, unit)}</>;
}

/** Standard spec-sheet table: label column + value column, zebra rows, semantic markup. */
export function SpecTable({ rows, caption }: { rows: SpecRowView[]; caption: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <table className="w-full text-sm">
        <caption className="sr-only">{caption}</caption>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.key} className="odd:bg-surface even:bg-surface-muted/50">
              <th scope="row" className="w-2/5 px-4 py-3 text-left align-top font-medium text-text-secondary sm:w-1/3">{r.label}</th>
              <td className="break-words px-4 py-3 text-text-primary">{r.content}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
