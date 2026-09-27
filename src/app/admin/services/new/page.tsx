import { ServiceForm } from "@/components/admin/ServiceForm";

export default function NewServicePage() {
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-text-primary">New service</h1>
      <ServiceForm />
    </div>
  );
}
