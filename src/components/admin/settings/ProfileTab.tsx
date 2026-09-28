"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/Toast";
import { safeFetch, readError } from "@/lib/safe-fetch";
import { ROLE_LABELS } from "@/lib/rbac";

export function ProfileTab() {
  const { data: session, update } = useSession();
  const toast = useToast();
  const [name, setName] = useState(session?.user?.name ?? "");
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await safeFetch("/api/account/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setSaving(false);
    if (!res.ok) return toast.error("Couldn't update profile", await readError(res));
    await update();
    toast.success("Profile updated");
  }

  return (
    <form onSubmit={save} className="card max-w-xl space-y-5 p-6">
      <div>
        <label className="label" htmlFor="pname">Full name</label>
        <input id="pname" className="input" required minLength={2} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Email</label>
          <input className="input bg-surface-muted" value={session?.user?.email ?? ""} readOnly />
        </div>
        <div>
          <label className="label">Role</label>
          <input className="input bg-surface-muted" value={session?.user?.role ? ROLE_LABELS[session.user.role] : ""} readOnly />
        </div>
      </div>
      <p className="text-xs text-text-secondary">Your email and role can only be changed by another administrator.</p>
      <button className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save profile"}</button>
    </form>
  );
}
