import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ListingForm } from "@/components/admin/ListingForm";

export default async function EditListingPage({ params }: { params: { id: string } }) {
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: { images: { orderBy: { sortOrder: "asc" } }, specs: true },
  });
  if (!listing) return notFound();

  const specValues: Record<string, string> = {};
  listing.specs.forEach((s) => { specValues[s.specificationId] = s.value; });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-text-primary">Edit listing</h1>
      <ListingForm
        listingId={listing.id}
        initial={{
          serviceId: listing.serviceId,
          subServiceId: listing.subServiceId,
          title: listing.title,
          shortDesc: listing.shortDesc ?? "",
          description: listing.description ?? "",
          priceLabel: listing.priceLabel ?? "",
          location: listing.location ?? "",
          status: listing.status,
          isFeatured: listing.isFeatured,
          specValues,
          images: listing.images,
        }}
      />
    </div>
  );
}
