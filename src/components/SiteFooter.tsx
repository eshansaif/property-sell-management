import Link from "next/link";

export function SiteFooter() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Everest Listings";
  return (
    <footer className="border-t border-border bg-surface-muted">
      <div className="container-page grid grid-cols-2 gap-10 py-14 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <p className="font-display text-lg text-text-primary">{siteName}</p>
          <p className="mt-3 text-sm text-text-secondary">
            A trusted place to discover properties and services, and reach the right people quickly.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">Explore</p>
          <ul className="mt-3 space-y-2 text-sm text-text-secondary">
            <li><Link href="/services" className="hover:text-text-primary">All services</Link></li>
            <li><Link href="/#contact" className="hover:text-text-primary">Send an inquiry</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">Company</p>
          <ul className="mt-3 space-y-2 text-sm text-text-secondary">
            <li><Link href="/admin/login" className="hover:text-text-primary">Admin login</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">Contact</p>
          <ul className="mt-3 space-y-2 text-sm text-text-secondary">
            <li>hello@example.com</li>
            <li>+880 1XXX-XXXXXX</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-6">
        <p className="container-page text-xs text-text-secondary">
          © {new Date().getFullYear()} {siteName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
