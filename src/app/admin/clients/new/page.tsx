import { ClientForm } from "@/components/admin/ClientForm";

export default function NewClientPage() {
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-text-primary">Add client</h1>
      <ClientForm />
    </div>
  );
}
