import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ServiceCard } from "@/components/ServiceCard";
import { ListingCard } from "@/components/ListingCard";
import { InquiryForm } from "@/components/InquiryForm";

export const revalidate = 60;

export default async function HomePage() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Everest Listings";

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
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="border-b border-border bg-surface">
          <div className="container-page grid gap-10 py-16 md:grid-cols-2 md:items-center md:py-24">
            <div>
              <h1 className="font-display text-4xl leading-tight text-text-primary sm:text-5xl">
                Find the right property or service — and reach out in seconds.
              </h1>
              <p className="mt-5 max-w-lg text-base text-text-secondary">
                {siteName} connects you directly with verified listings across land, apartments,
                commercial space and professional services. Browse, choose, and send an inquiry —
                no account required.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/services" className="btn-primary">Browse services</Link>
                <Link href="#contact" className="btn-outline">Send an inquiry</Link>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="aspect-[4/3] rounded-xl bg-surface-muted" />
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
              <h2 className="mb-8 font-display text-2xl text-text-primary">Featured listings</h2>
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
