"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";

type Service = {
  id: string;
  name: string;
  slug: string;
  status: string;
  isFeatured: boolean;
  _count: { listings: number; subServices: number };
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[] | null>(null);

  async function load() {
    const res = await fetch("/api/services");
    setServices(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this service? If it has listings, it will be archived instead.")) return;
    await fetch(`/api/services/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-text-primary">Services</h1>
        <Link href="/admin/services/new" className="btn-primary">New service</Link>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-left text-xs text-text-secondary">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Sub-services</th>
              <th className="px-4 py-3">Listings</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {services?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-text-secondary">No services yet. Create your first one to get started.</td></tr>
            )}
            {services?.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium text-text-primary">{s.name}</td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-3 text-text-secondary">{s._count.subServices}</td>
                <td className="px-4 py-3 text-text-secondary">{s._count.listings}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/services/${s.id}/edit`} className="mr-3 text-accent hover:underline">Edit</Link>
                  <button onClick={() => handleDelete(s.id)} className="text-error hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
