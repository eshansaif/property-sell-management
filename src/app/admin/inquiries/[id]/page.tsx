"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";

const STATUSES = ["NEW", "CONTACTED", "IN_PROGRESS", "FOLLOW_UP", "CONVERTED", "CLOSED", "REJECTED"];

export default function InquiryDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [inquiry, setInquiry] = useState<any>(null);
  const [note, setNote] = useState("");

  async function load() {
    const res = await fetch(`/api/inquiries/${id}`);
    setInquiry(await res.json());
  }

  useEffect(() => { load(); }, [id]);

  async function updateStatus(status: string) {
    await fetch(`/api/inquiries/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    await fetch(`/api/inquiries/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note }) });
    setNote("");
    load();
  }

  if (!inquiry) return <p className="text-text-secondary">Loading...</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="card p-6">
          <h1 className="font-display text-xl text-text-primary">Customer information</h1>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-text-secondary">Name</dt><dd className="font-medium text-text-primary">{inquiry.name}</dd></div>
            <div><dt className="text-text-secondary">Phone</dt><dd className="font-medium text-text-primary">{inquiry.phone}</dd></div>
            <div><dt className="text-text-secondary">Email</dt><dd className="font-medium text-text-primary">{inquiry.email ?? "—"}</dd></div>
            <div><dt className="text-text-secondary">Preferred contact</dt><dd className="font-medium text-text-primary">{inquiry.preferredContact ?? "—"}</dd></div>
          </dl>
        </div>

        <div className="card p-6">
          <h2 className="font-display text-lg text-text-primary">Interested in</h2>
          <p className="mt-2 text-sm text-text-secondary">{inquiry.listing?.title ?? "General inquiry"}</p>
          <h2 className="mt-6 font-display text-lg text-text-primary">Message</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-text-secondary">{inquiry.message}</p>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 font-display text-lg text-text-primary">Activity timeline</h2>
          <ul className="space-y-3">
            {inquiry.activities?.map((a: any) => (
              <li key={a.id} className="border-l-2 border-border pl-4 text-sm">
                <p className="text-text-primary">{a.type.replace("_", " ")}{a.detail ? `: ${a.detail}` : ""}</p>
                <p className="text-xs text-text-secondary">{new Date(a.createdAt).toLocaleString()} {a.actor ? `· ${a.actor.name}` : ""}</p>
              </li>
            ))}
          </ul>

          <h3 className="mb-2 mt-6 text-sm font-medium text-text-primary">Notes</h3>
          <ul className="mb-4 space-y-2">
            {inquiry.notes?.map((n: any) => (
              <li key={n.id} className="rounded-md bg-surface-muted p-3 text-sm text-text-primary">
                {n.content}
                <p className="mt-1 text-xs text-text-secondary">{n.author?.name} · {new Date(n.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
          <form onSubmit={addNote} className="flex gap-2">
            <input className="input" placeholder="Add an internal note..." value={note} onChange={(e) => setNote(e.target.value)} />
            <button className="btn-outline">Add</button>
          </form>
        </div>
      </div>

      <div className="space-y-6">
        <div className="card p-6">
          <h2 className="mb-3 font-display text-lg text-text-primary">Lead status</h2>
          <StatusBadge status={inquiry.status} />
          <div className="mt-4 grid grid-cols-2 gap-2">
            {STATUSES.map((s) => (
              <button key={s} onClick={() => updateStatus(s)} className={`btn-outline !py-1.5 text-xs ${inquiry.status === s ? "!border-primary !text-primary" : ""}`}>
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
        <div className="card p-6 text-sm text-text-secondary">
          <p>Received {new Date(inquiry.createdAt).toLocaleString()}</p>
          {inquiry.sourcePage && <p className="mt-1">From: {inquiry.sourcePage}</p>}
        </div>
      </div>
    </div>
  );
}
