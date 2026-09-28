import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Skeleton, CardGridSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <>
      <SiteHeader />
      <main className="container-page py-10 md:py-16">
        <Skeleton className="h-4 w-52" />
        <Skeleton className="mt-4 h-9 w-64" />
        <Skeleton className="mt-8 h-20 w-full" />
        <div className="mt-8">
          <CardGridSkeleton count={9} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
