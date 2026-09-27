import Link from "next/link";

export function SiteHeader() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Everest Listings";
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="font-display text-xl tracking-tight text-text-primary">
          {siteName}
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-text-secondary md:flex">
          <Link href="/services" className="hover:text-text-primary">Services</Link>
          <Link href="/#how-it-works" className="hover:text-text-primary">How it works</Link>
          <Link href="/#contact" className="hover:text-text-primary">Contact</Link>
        </nav>
        <Link href="/#contact" className="btn-accent">Send Inquiry</Link>
      </div>
    </header>
  );
}
