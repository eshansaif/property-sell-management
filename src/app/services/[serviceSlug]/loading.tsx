import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Skeleton, CardGridSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <>
      <SiteHeader />
      <main className="container-page py-16">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-9 w-64" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full" />
        <div className="mt-10">
          <CardGridSkeleton count={6} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
