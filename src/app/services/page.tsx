import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ServiceCard } from "@/components/ServiceCard";
import { SearchBar } from "@/components/public/SearchBar";
import { PaginationLinks } from "@/components/ui/PaginationLinks";

export const revalidate = 60;

const PAGE_SIZE = 12;

export const metadata: Metadata = {
  title: "All Services",
  description: "Browse every service and category available on the platform.",
};

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page || 1));
  const where: any = { status: "PUBLISHED" };

  if (searchParams.q) {
    where.OR = [
      { name: { contains: searchParams.q, mode: "insensitive" } },
      { shortDesc: { contains: searchParams.q, mode: "insensitive" } },
    ];
  }

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      orderBy: { displayOrder: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { listings: { where: { status: "PUBLISHED" } } } } },
    }),
    prisma.service.count({ where }),
  ]);

  return (
    <>
      <SiteHeader />
      <main className="container-page py-10 md:py-16">
        <h1 className="font-display text-3xl text-text-primary">All services</h1>
        <p className="mt-2 max-w-xl text-sm text-text-secondary">
          Pick a category to see its sub-services and listings.
        </p>

        <div className="mt-6 max-w-md">
          <SearchBar defaultValue={searchParams.q} placeholder="Search services..." />
        </div>

        {services.length === 0 ? (
          <div className="card mt-10 p-12 text-center">
            <p className="text-text-secondary">
              {searchParams.q ? "No services match your search." : "No services published yet."}
            </p>
          </div>
        ) : (
          <>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
            <PaginationLinks page={page} pageSize={PAGE_SIZE} total={total} />
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
