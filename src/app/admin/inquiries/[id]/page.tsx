"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { InquiryDetailSkeleton } from "@/components/ui/Skeleton";
import { Combobox } from "@/components/ui/Combobox";
import { useToast } from "@/components/ui/Toast";
import { safeFetch, readError } from "@/lib/safe-fetch";

const STATUSES = ["NEW", "CONTACTED", "IN_PROGRESS", "FOLLOW_UP", "CONVERTED", "CLOSED", "REJECTED"];
type Assignee = { id: string; name: string; role: string };

export default function InquiryDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const toast = useToast();
  const [inquiry, setInquiry] = useState<any>(null);
  const [missing, setMissing] = useState(false);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await safeFetch(`/api/inquiries/${id}`);
    if (!res.ok) {
      toast.error("Couldn't load inquiry", await readError(res));
      setMissing(true);
      return;
    }
    setInquiry(await res.json());
  }, [id, toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    safeFetch("/api/admin/assignees").then(async (r) => r.ok && setAssignees(await r.json()));
  }, []);

  async function update(body: object, success: string) {
    setBusy(true);
    const res = await safeFetch(`/api/inquiries/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    if (!res.ok) return toast.error("Couldn't update inquiry", await readError(res));
    toast.success(success);
    load();
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    await update({ note }, "Note added");
    setNote("");
  }

  if (missing) {
    return (
      <div className="card max-w-lg p-10 text-center">
        <p className="font-display text-lg text-text-primary">Inquiry not found</p>
        <p className="mt-1 text-sm text-text-secondary">It may have been removed, or you may not have access.</p>
        <Link href="/admin/inquiries" className="btn-outline mt-5">Back to inquiries</Link>
      </div>
    );
  }
  if (!inquiry) return <InquiryDetailSkeleton />;

  const phone = String(inquiry.phone).replace(/[^\d+]/g, "");

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Link href="/admin/inquiries" className="inline-block text-xs text-text-secondary hover:text-text-primary">← All inquiries</Link>

        <div className="card p-6">
          <h1 className="font-display text-xl text-text-primary">Customer information</h1>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-text-secondary">Name</dt><dd className="font-medium text-text-primary">{inquiry.name}</dd></div>
            <div><dt className="text-text-secondary">Phone</dt><dd className="font-medium text-text-primary">{inquiry.phone}</dd></div>
            <div><dt className="text-text-secondary">Email</dt><dd className="break-all font-medium text-text-primary">{inquiry.email ?? "—"}</dd></div>
            <div><dt className="text-text-secondary">Preferred contact</dt><dd className="font-medium text-text-primary">{inquiry.preferredContact ?? "—"}</dd></div>
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href={`tel:${phone}`} className="btn-outline !py-1.5 text-xs">Call</a>
            <a href={`https://wa.me/${phone.replace("+", "")}`} target="_blank" rel="noopener noreferrer" className="btn-outline !py-1.5 text-xs">WhatsApp</a>
            {inquiry.email && <a href={`mailto:${inquiry.email}`} className="btn-outline !py-1.5 text-xs">Email</a>}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-display text-lg text-text-primary">Interested in</h2>
          <p className="mt-2 text-sm text-text-secondary">{inquiry.listing?.title ?? "General inquiry"}</p>
          <h2 className="mt-6 font-display text-lg text-text-primary">Message</h2>
          <p className="mt-2 whitespace-pre-line break-words text-sm text-text-secondary">{inquiry.message}</p>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 font-display text-lg text-text-primary">Activity timeline</h2>
          <ul className="space-y-3">
            {inquiry.activities?.map((a: any) => (
              <li key={a.id} className="border-l-2 border-border pl-4 text-sm">
                <p className="text-text-primary">{String(a.type).replace("_", " ")}{a.detail ? `: ${String(a.detail).replace("_", " ")}` : ""}</p>
                <p className="text-xs text-text-secondary">{new Date(a.createdAt).toLocaleString()} {a.actor ? `· ${a.actor.name}` : ""}</p>
              </li>
            ))}
          </ul>

          <h3 className="mb-2 mt-6 text-sm font-medium text-text-primary">Internal notes</h3>
          <ul className="mb-4 space-y-2">
            {inquiry.notes?.length === 0 && <li className="text-xs text-text-secondary">No notes yet.</li>}
            {inquiry.notes?.map((n: any) => (
              <li key={n.id} className="rounded-md bg-surface-muted p-3 text-sm text-text-primary">
                <span className="whitespace-pre-line break-words">{n.content}</span>
                <p className="mt-1 text-xs text-text-secondary">{n.author?.name} · {new Date(n.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
          <form onSubmit={addNote} className="flex gap-2">
            <input className="input" placeholder="Add an internal note..." maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
            <button className="btn-outline" disabled={busy || !note.trim()}>Add</button>
          </form>
        </div>
      </div>

      <div className="space-y-6">
        <div className="card p-6">
          <h2 className="mb-3 font-display text-lg text-text-primary">Lead status</h2>
          <StatusBadge status={inquiry.status} />
          <div className="mt-4 grid grid-cols-2 gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                disabled={busy || inquiry.status === s}
                onClick={() => update({ status: s }, `Status changed to ${s.replace("_", " ").toLowerCase()}`)}
                className={`btn-outline !py-1.5 text-xs ${inquiry.status === s ? "!border-primary !text-primary" : ""}`}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-3 font-display text-lg text-text-primary">Assigned to</h2>
          <Combobox
            options={assignees.map((a) => ({ value: a.id, label: a.name, sublabel: a.role.replace("_", " ").toLowerCase() }))}
            value={inquiry.assignee?.id ?? ""}
            onChange={(v) => update({ assigneeId: v || null }, v ? "Inquiry assigned" : "Assignment removed")}
            placeholder="Unassigned"
          />
        </div>

        <div className="card p-6 text-sm text-text-secondary">
          <p>Received {new Date(inquiry.createdAt).toLocaleString()}</p>
          {inquiry.sourcePage && <p className="mt-1 break-all">From: {inquiry.sourcePage}</p>}
        </div>
      </div>
    </div>
  );
}
