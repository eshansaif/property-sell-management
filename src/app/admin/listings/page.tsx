"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";

type Listing = {
  id: string; title: string; status: string; priceLabel: string | null;
  service: { name: string }; subService: { name: string };
};

export default function AdminListingsPage() {
  const [items, setItems] = useState<Listing[] | null>(null);
  const [q, setQ] = useState("");

  async function load(query = "") {
    const res = await fetch(`/api/listings${query ? `?q=${encodeURIComponent(query)}` : ""}`);
    const data = await res.json();
    setItems(data.items);
  }

  useEffect(() => { load(); }, []);

  async function handleArchive(id: string) {
    if (!confirm("Archive this listing?")) return;
    await fetch(`/api/listings/${id}`, { method: "DELETE" });
    load(q);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-text-primary">Listings</h1>
        <Link href="/admin/listings/new" className="btn-primary">New listing</Link>
      </div>

      <div className="mb-4 flex gap-2">
        <input
          className="input max-w-xs"
          placeholder="Search by title..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(q)}
        />
        <button onClick={() => load(q)} className="btn-outline">Search</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-left text-xs text-text-secondary">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-text-secondary">No listings yet. Create your first listing to start receiving customer inquiries.</td></tr>
            )}
            {items?.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3 font-medium text-text-primary">{l.title}</td>
                <td className="px-4 py-3 text-text-secondary">{l.service.name} / {l.subService.name}</td>
                <td className="px-4 py-3 text-text-secondary">{l.priceLabel ?? "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/listings/${l.id}/edit`} className="mr-3 text-accent hover:underline">Edit</Link>
                  <button onClick={() => handleArchive(l.id)} className="text-error hover:underline">Archive</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
