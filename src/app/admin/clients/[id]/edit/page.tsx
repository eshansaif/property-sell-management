import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClientForm } from "@/components/admin/ClientForm";

export default async function EditClientPage({ params }: { params: { id: string } }) {
  const client = await prisma.client.findUnique({ where: { id: params.id } });
  if (!client) return notFound();

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-text-primary">Edit client</h1>
      <ClientForm
        clientId={client.id}
        initial={{
          name: client.name,
          logoUrl: client.logoUrl,
          websiteUrl: client.websiteUrl ?? "",
          displayOrder: client.displayOrder,
          isActive: client.isActive,
        }}
      />
    </div>
  );
}
