import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Skeleton, CardGridSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <>
      <SiteHeader />
      <main className="container-page py-10 md:py-14">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-9 w-72" />
        <Skeleton className="mt-8 h-[132px] w-full" />
        <div className="mt-8"><CardGridSkeleton count={9} /></div>
      </main>
      <SiteFooter />
    </>
  );
}
