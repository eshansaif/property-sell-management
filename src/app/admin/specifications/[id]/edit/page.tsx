import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SpecificationForm } from "@/components/admin/SpecificationForm";

export default async function EditSpecificationPage({ params }: { params: { id: string } }) {
  const spec = await prisma.specification.findUnique({ where: { id: params.id } });
  if (!spec) return notFound();

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-text-primary">Edit specification</h1>
      <SpecificationForm
        specId={spec.id}
        initial={{
          serviceId: spec.serviceId ?? undefined,
          subServiceId: spec.subServiceId ?? undefined,
          name: spec.name,
          type: spec.type,
          unit: spec.unit ?? "",
          options: spec.options,
          isRequired: spec.isRequired,
          isFilterable: spec.isFilterable,
          displayOrder: spec.displayOrder,
        }}
      />
    </div>
  );
}
