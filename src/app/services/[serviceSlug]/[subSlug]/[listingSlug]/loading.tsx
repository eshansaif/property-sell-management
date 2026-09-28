import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ListingDetailSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <>
      <SiteHeader />
      <ListingDetailSkeleton />
      <SiteFooter />
    </>
  );
}
