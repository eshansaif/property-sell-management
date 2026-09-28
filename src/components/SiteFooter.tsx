import Link from "next/link";
import { getSiteSettings } from "@/lib/site-settings";
import { getNavTreeSafe } from "@/lib/nav-data";
import { LABELS } from "@/lib/labels";

export async function SiteFooter() {
  const [s, tree] = await Promise.all([getSiteSettings(), getNavTreeSafe()]);
  const hasContact = s.contactEmail || s.contactPhone || s.whatsapp || s.address;

  return (
    <footer className="border-t border-border bg-surface-muted">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-lg text-text-primary">{s.siteName}</p>
          {s.tagline && <p className="mt-3 max-w-xs text-sm text-text-secondary">{s.tagline}</p>}
          {(s.facebookUrl || s.instagramUrl) && (
            <div className="mt-4 flex gap-4 text-sm">
              {s.facebookUrl && <a href={s.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text-primary">Facebook</a>}
              {s.instagramUrl && <a href={s.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text-primary">Instagram</a>}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{LABELS.services}</p>
          <ul className="mt-3 space-y-2 text-sm text-text-secondary">
            {tree.slice(0, 7).map((t) => (
              <li key={t.id}><Link href={`/services/${t.slug}`} className="hover:text-text-primary">{t.name}</Link></li>
            ))}
            {tree.length === 0 && <li>Coming soon</li>}
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">Explore</p>
          <ul className="mt-3 space-y-2 text-sm text-text-secondary">
            <li><Link href="/listings" className="hover:text-text-primary">{LABELS.allListings}</Link></li>
            <li><Link href="/services" className="hover:text-text-primary">All services</Link></li>
            <li><Link href="/#how-it-works" className="hover:text-text-primary">{LABELS.howItWorks}</Link></li>
            <li><Link href="/#contact" className="hover:text-text-primary">{LABELS.sendInquiry}</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{LABELS.contact}</p>
          <ul className="mt-3 space-y-2 text-sm text-text-secondary">
            {s.contactEmail && <li><a href={`mailto:${s.contactEmail}`} className="hover:text-text-primary">{s.contactEmail}</a></li>}
            {s.contactPhone && <li><a href={`tel:${s.contactPhone}`} className="hover:text-text-primary">{s.contactPhone}</a></li>}
            {s.whatsapp && <li><a href={`https://wa.me/${s.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="hover:text-text-primary">WhatsApp</a></li>}
            {s.address && <li className="max-w-xs">{s.address}</li>}
            {!hasContact && <li>Use the inquiry form and we&apos;ll get back to you.</li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-6">
        <div className="container-page flex flex-wrap items-center justify-between gap-2 text-xs text-text-secondary">
          <p>© {new Date().getFullYear()} {s.siteName}. All rights reserved.</p>
          <Link href="/admin/login" className="hover:text-text-primary">Team login</Link>
        </div>
      </div>
    </footer>
  );
}
