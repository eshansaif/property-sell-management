"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { can } from "@/lib/rbac";
import { SettingsSkeleton } from "@/components/ui/Skeleton";
import { ProfileTab } from "@/components/admin/settings/ProfileTab";
import { PasswordTab } from "@/components/admin/settings/PasswordTab";
import { TeamTab } from "@/components/admin/settings/TeamTab";
import { SiteTab } from "@/components/admin/settings/SiteTab";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [tab, setTab] = useState("profile");

  if (status === "loading") return <SettingsSkeleton />;

  const role = session?.user?.role;
  const tabs = [
    { id: "profile", label: "My profile", show: true },
    { id: "password", label: "Password", show: true },
    { id: "team", label: "Team", show: can(role, "user:read") },
    { id: "site", label: "Site settings", show: can(role, "settings:read") },
  ].filter((t) => t.show);

  return (
    <div>
      <h1 className="font-display text-2xl text-text-primary">Settings</h1>
      <p className="mt-1 text-sm text-text-secondary">Manage your account, your team and how the public site presents itself.</p>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm transition-colors ${
              tab === t.id ? "border-primary font-medium text-text-primary" : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "profile" && <ProfileTab />}
        {tab === "password" && <PasswordTab />}
        {tab === "team" && <TeamTab />}
        {tab === "site" && <SiteTab />}
      </div>
    </div>
  );
}
