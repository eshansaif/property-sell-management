"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import type { RoleName } from "@prisma/client";
import { Combobox } from "@/components/ui/Combobox";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { safeFetch, readError } from "@/lib/safe-fetch";
import { canManageRole, ROLE_LABELS } from "@/lib/rbac";
import { generatePassword, PASSWORD_HINT, validatePassword } from "@/lib/password-policy";

type Member = { id: string; name: string; email: string; role: RoleName; isActive: boolean; createdAt: string };

const ROLE_HELP: Record<RoleName, string> = {
  SUPER_ADMIN: "Full control, including other admins",
  ADMIN: "Manages content, inquiries, team and settings",
  STAFF: "Views listings, handles assigned inquiries",
};

export function TeamTab() {
  const { data: session } = useSession();
  const toast = useToast();
  const actorRole = session?.user?.role;
  const [items, setItems] = useState<Member[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [creds, setCreds] = useState<{ email: string; password: string; label: string } | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(async (query: string, p: number) => {
    setItems(null);
    const params = new URLSearchParams({ page: String(p) });
    if (query) params.set("q", query);
    const res = await safeFetch(`/api/admin/users?${params}`);
    if (!res.ok) { toast.error("Couldn't load team", await readError(res)); setItems([]); return; }
    const data = await res.json();
    setItems(data.items); setTotal(data.total);
  }, [toast]);

  useEffect(() => { load(q, page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  async function patch(m: Member, body: object, success: string) {
    const res = await safeFetch(`/api/admin/users/${m.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) return toast.error("Couldn't update team member", await readError(res));
    const data = await res.json();
    toast.success(success);
    if (data.tempPassword) setCreds({ email: m.email, password: data.tempPassword, label: `New temporary password for ${m.name}` });
    load(q, page);
  }

  const roleOptions = (["ADMIN", "STAFF", "SUPER_ADMIN"] as RoleName[])
    .filter((r) => canManageRole(actorRole, r))
    .map((r) => ({ value: r, label: ROLE_LABELS[r], sublabel: ROLE_HELP[r] }));

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search team..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            clearTimeout(debounce.current);
            debounce.current = setTimeout(() => { setPage(1); load(e.target.value, 1); }, 350);
          }}
        />
        <button className="btn-primary" onClick={() => setAdding((a) => !a)}>{adding ? "Close" : "Add team member"}</button>
      </div>

      {creds && (
        <div className="card border-accent/40 bg-accent/5 p-5">
          <p className="text-sm font-medium text-text-primary">{creds.label}</p>
          <p className="mt-1 text-xs text-text-secondary">Shown only once. Share it securely and ask them to change it after signing in.</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md bg-surface px-3 py-2 font-mono text-sm">
            <span>{creds.email}</span><span className="text-text-secondary">/</span><span>{creds.password}</span>
            <button
              className="ml-auto text-xs font-sans font-medium text-accent hover:underline"
              onClick={async () => { await navigator.clipboard?.writeText(`${creds.email} / ${creds.password}`); toast.info("Copied to clipboard"); }}
            >
              Copy
            </button>
          </div>
          <button className="mt-3 text-xs text-text-secondary hover:underline" onClick={() => setCreds(null)}>Dismiss</button>
        </div>
      )}

      {adding && (
        <AddMember
          roleOptions={roleOptions}
          onDone={(c) => { setAdding(false); setCreds(c); setPage(1); load(q, 1); }}
        />
      )}

      <div className="card divide-y divide-border">
        {items === null && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4"><Skeleton className="h-9 w-9 rounded-full" /><div className="flex-1"><Skeleton className="h-4 w-40" /><Skeleton className="mt-2 h-3 w-56" /></div></div>
        ))}
        {items?.length === 0 && <p className="p-10 text-center text-sm text-text-secondary">No team members found.</p>}
        {items?.map((m) => {
          const isSelf = m.id === session?.user?.id;
          const manageable = !isSelf && canManageRole(actorRole, m.role);
          return (
            <div key={m.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">{m.name.charAt(0).toUpperCase()}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">{m.name} {isSelf && <span className="ml-1 text-xs font-normal text-text-secondary">(you)</span>}</p>
                  <p className="truncate text-xs text-text-secondary">{m.email}</p>
                </div>
                {!m.isActive && <span className="badge bg-error/10 text-error">Deactivated</span>}
              </div>
              <div className="w-full sm:w-44">
                {manageable ? (
                  <Combobox options={roleOptions} value={m.role} clearable={false} placeholder="Role" onChange={(v) => v !== m.role && patch(m, { role: v }, "Role updated")} />
                ) : (
                  <span className="badge bg-surface-muted text-text-secondary">{ROLE_LABELS[m.role]}</span>
                )}
              </div>
              {manageable && (
                <div className="flex gap-3 text-xs">
                  <button className="text-accent hover:underline" onClick={() => confirm(`Generate a new temporary password for ${m.name}?`) && patch(m, { resetPassword: true }, "Password reset")}>Reset password</button>
                  <button
                    className={m.isActive ? "text-error hover:underline" : "text-success hover:underline"}
                    onClick={() => (!m.isActive || confirm(`Deactivate ${m.name}? They will lose access immediately.`)) && patch(m, { isActive: !m.isActive }, m.isActive ? "Team member deactivated" : "Team member reactivated")}
                  >
                    {m.isActive ? "Deactivate" : "Reactivate"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Pagination page={page} pageSize={20} total={total} onPageChange={setPage} />
    </div>
  );
}

function AddMember({ roleOptions, onDone }: { roleOptions: { value: string; label: string; sublabel: string }[]; onDone: (c: { email: string; password: string; label: string }) => void }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("ADMIN");
  const [password, setPassword] = useState(() => generatePassword());
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const err = validatePassword(password);
    if (err) return toast.error("Check the password", err);
    setSaving(true);
    const res = await safeFetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, role, password }) });
    setSaving(false);
    if (!res.ok) return toast.error("Couldn't add team member", await readError(res));
    toast.success("Team member added", `${name} can now sign in.`);
    onDone({ email: email.toLowerCase(), password, label: `Sign-in details for ${name}` });
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <h3 className="font-display text-lg text-text-primary">Add team member</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">Full name *</label><input className="input" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><label className="label">Email *</label><input type="email" className="input" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label className="label">Role *</label><Combobox options={roleOptions} value={role} onChange={setRole} clearable={false} placeholder="Role" /></div>
        <div>
          <label className="label">Temporary password *</label>
          <div className="flex gap-2">
            <input className="input font-mono" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="btn-outline shrink-0" onClick={() => setPassword(generatePassword())}>Generate</button>
          </div>
          <p className="mt-1.5 text-xs text-text-secondary">{PASSWORD_HINT}</p>
        </div>
      </div>
      <button className="btn-primary" disabled={saving}>{saving ? "Adding..." : "Add member"}</button>
    </form>
  );
}
