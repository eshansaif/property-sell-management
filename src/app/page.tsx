import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ServiceCard } from "@/components/ServiceCard";
import { ListingCard } from "@/components/ListingCard";
import { InquiryForm } from "@/components/InquiryForm";
import { SearchBar } from "@/components/public/SearchBar";
import { getSiteSettings } from "@/lib/site-settings";
import { LABELS } from "@/lib/labels";

export const revalidate = 60;

export default async function HomePage() {
  const settings = await getSiteSettings();
  const siteName = settings.siteName;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
  };

  const [services, featuredListings] = await Promise.all([
    prisma.service.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { displayOrder: "asc" },
      include: { _count: { select: { listings: { where: { status: "PUBLISHED" } } } } },
      take: 8,
    }),
    prisma.listing.findMany({
      where: { status: "PUBLISHED", isFeatured: true },
      orderBy: { publishedAt: "desc" },
      include: { images: { where: { isCover: true }, take: 1 }, service: true, subService: true },
      take: 6,
    }),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }} />
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-surface">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-accent/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-32 top-40 h-72 w-72 rounded-full bg-primary/5 blur-3xl"
          />
          <div className="container-page relative grid gap-10 py-16 md:grid-cols-2 md:items-center md:py-28">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-medium text-text-secondary">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> Trusted by verified listers
              </span>
              <h1 className="mt-5 font-display text-4xl leading-[1.1] text-text-primary sm:text-5xl">
                Find the right property or service — and reach out in seconds.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-text-secondary">
                {siteName} connects you directly with verified listings across land, apartments,
                commercial space and professional services. Browse, choose, and send an inquiry —
                no account required.
              </p>
              <div className="mt-8 max-w-md">
                <SearchBar redirectTo="/services" placeholder="Search for land, apartments, services..." />
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/services" className="btn-primary">Browse services</Link>
                <Link href="#contact" className="btn-outline">Send an inquiry</Link>
              </div>
            </div>
            <div className="relative hidden md:block">
              <div className="relative ml-auto aspect-[4/3] w-full max-w-md">
                <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-2xl bg-primary/[0.06]" />
                <div className="card relative flex h-full w-full flex-col justify-between overflow-hidden p-6">
                  <div className="flex items-center justify-between">
                    <div className="h-2.5 w-24 rounded-full bg-surface-muted" />
                    <div className="h-6 w-6 rounded-full bg-accent/20" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-24 w-full rounded-lg bg-surface-muted" />
                    <div className="h-3 w-3/4 rounded-full bg-surface-muted" />
                    <div className="h-3 w-1/2 rounded-full bg-surface-muted" />
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <div className="h-3 w-16 rounded-full bg-accent/20" />
                    <div className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">Send Inquiry</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="container-page py-16">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-display text-2xl text-text-primary">Explore services</h2>
            <Link href="/services" className="text-sm font-medium text-accent hover:underline">View all →</Link>
          </div>
          {services.length === 0 ? (
            <EmptyState
              title="No services yet"
              body="Once services are published from the admin dashboard, they'll appear here."
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((s) => (
                <ServiceCard
                  key={s.id}
                  name={s.name}
                  slug={s.slug}
                  shortDesc={s.shortDesc}
                  coverImage={s.coverImage}
                  listingCount={s._count.listings}
                />
              ))}
            </div>
          )}
        </section>

        {/* Featured listings */}
        {featuredListings.length > 0 && (
          <section className="border-y border-border bg-surface-muted/60 py-16">
            <div className="container-page">
              <div className="mb-8 flex items-end justify-between gap-4">
                <h2 className="font-display text-2xl text-text-primary">Featured listings</h2>
                <Link href="/listings" className="text-sm font-medium text-accent hover:underline">{LABELS.allListings} →</Link>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featuredListings.map((l) => (
                  <ListingCard
                    key={l.id}
                    title={l.title}
                    slug={l.slug}
                    serviceSlug={l.service.slug}
                    subServiceSlug={l.subService.slug}
                    shortDesc={l.shortDesc}
                    priceLabel={l.priceLabel}
                    location={l.location}
                    coverImage={l.images[0]?.url}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* How it works */}
        <section id="how-it-works" className="container-page py-16">
          <h2 className="mb-10 font-display text-2xl text-text-primary">How it works</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { title: "Browse", body: "Explore services and listings that match what you need." },
              { title: "Choose", body: "Open a listing to see full details, images and pricing." },
              { title: "Send inquiry", body: "Share your contact details and we'll reach out directly." },
            ].map((step, i) => (
              <div key={step.title} className="card p-6">
                <span className="font-display text-3xl text-accent">{i + 1}</span>
                <h3 className="mt-3 text-base font-medium text-text-primary">{step.title}</h3>
                <p className="mt-1.5 text-sm text-text-secondary">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why choose us */}
        <section className="container-page py-16">
          <h2 className="mb-10 font-display text-2xl text-text-primary">Why choose us</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { title: "Verified listings", body: "Every listing is reviewed before it goes live, so you're never chasing a dead lead." },
              { title: "Direct communication", body: "Your inquiry goes straight to the team behind the listing — no middlemen, no delays." },
              { title: "No account needed", body: "Browse and inquire freely. Create an account only if and when you choose to." },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-medium text-text-primary">{item.title}</h3>
                  <p className="mt-1 text-sm text-text-secondary">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact / generic inquiry */}
        <section className="border-t border-border bg-surface-muted/60 py-16">
          <div className="container-page grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl text-text-primary">Have something specific in mind?</h2>
              <p className="mt-3 max-w-md text-sm text-text-secondary">
                Send us a message and our team will help you find the right listing or service —
                no need to search through everything yourself.
              </p>
            </div>
            <InquiryForm sourcePage="/" />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="card flex flex-col items-center gap-2 p-12 text-center">
      <p className="font-display text-lg text-text-primary">{title}</p>
      <p className="text-sm text-text-secondary">{body}</p>
    </div>
  );
}
