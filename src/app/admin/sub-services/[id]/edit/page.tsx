import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SubServiceForm } from "@/components/admin/SubServiceForm";

export default async function EditSubServicePage({ params }: { params: { id: string } }) {
  const sub = await prisma.subService.findUnique({ where: { id: params.id } });
  if (!sub) return notFound();

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-text-primary">Edit sub-service</h1>
      <SubServiceForm
        subServiceId={sub.id}
        initial={{
          name: sub.name,
          serviceId: sub.serviceId,
          shortDesc: sub.shortDesc ?? "",
          description: sub.description ?? "",
          status: sub.status,
          isFeatured: sub.isFeatured,
          displayOrder: sub.displayOrder,
        }}
      />
    </div>
  );
}
