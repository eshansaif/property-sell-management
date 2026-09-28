import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Skeleton, CardGridSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <>
      <SiteHeader />
      <main className="container-page py-10 md:py-16">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="mt-3 h-4 w-80" />
        <Skeleton className="mt-6 h-11 w-full max-w-md" />
        <div className="mt-10">
          <CardGridSkeleton count={8} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
