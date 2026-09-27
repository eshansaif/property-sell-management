import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ServiceForm } from "@/components/admin/ServiceForm";

export default async function EditServicePage({ params }: { params: { id: string } }) {
  const service = await prisma.service.findUnique({ where: { id: params.id } });
  if (!service) return notFound();

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-text-primary">Edit service</h1>
      <ServiceForm
        serviceId={service.id}
        initial={{
          name: service.name,
          shortDesc: service.shortDesc ?? "",
          description: service.description ?? "",
          coverImage: service.coverImage ?? "",
          status: service.status,
          isFeatured: service.isFeatured,
          seoTitle: service.seoTitle ?? "",
          seoDescription: service.seoDescription ?? "",
          displayOrder: service.displayOrder,
        }}
      />
    </div>
  );
}
