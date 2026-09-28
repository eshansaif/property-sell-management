"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { safeFetch, readError } from "@/lib/safe-fetch";
import { PASSWORD_HINT, validatePassword } from "@/lib/password-policy";

export function PasswordTab() {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const problem = next ? validatePassword(next) : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const err = validatePassword(next) ?? (next !== confirm ? "The new passwords don't match." : null);
    if (err) return toast.error("Check your new password", err);

    setSaving(true);
    const res = await safeFetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    setSaving(false);
    if (!res.ok) return toast.error("Couldn't change password", await readError(res));
    setCurrent(""); setNext(""); setConfirm("");
    toast.success("Password changed", "Use your new password next time you sign in.");
  }

  const type = show ? "text" : "password";
  return (
    <form onSubmit={submit} className="card max-w-xl space-y-5 p-6" autoComplete="off">
      <div>
        <label className="label" htmlFor="cur">Current password</label>
        <input id="cur" type={type} className="input" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="new">New password</label>
        <input id="new" type={type} className="input" required autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
        <p className={`mt-1.5 text-xs ${problem ? "text-error" : "text-text-secondary"}`}>{problem ?? PASSWORD_HINT}</p>
      </div>
      <div>
        <label className="label" htmlFor="conf">Confirm new password</label>
        <input id="conf" type={type} className="input" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {confirm && next !== confirm && <p className="mt-1.5 text-xs text-error">Passwords don&apos;t match yet.</p>}
      </div>
      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show passwords
      </label>
      <button className="btn-primary" disabled={saving}>{saving ? "Updating..." : "Change password"}</button>
    </form>
  );
}
