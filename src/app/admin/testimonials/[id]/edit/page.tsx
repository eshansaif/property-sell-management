import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TestimonialForm } from "@/components/admin/TestimonialForm";

export default async function EditTestimonialPage({ params }: { params: { id: string } }) {
  const t = await prisma.testimonial.findUnique({ where: { id: params.id } });
  if (!t) return notFound();
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-text-primary">Edit testimonial</h1>
      <TestimonialForm
        id={t.id}
        initial={{ authorName: t.authorName, authorRole: t.authorRole ?? "", authorPhoto: t.authorPhoto ?? "", content: t.content, rating: t.rating, displayOrder: t.displayOrder, isActive: t.isActive }}
      />
    </div>
  );
}
