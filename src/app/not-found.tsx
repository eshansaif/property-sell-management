import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="container-page flex flex-col items-center justify-center py-32 text-center">
        <p className="font-display text-5xl text-text-primary">404</p>
        <h1 className="mt-3 font-display text-xl text-text-primary">Page not found</h1>
        <p className="mt-2 max-w-md text-sm text-text-secondary">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <Link href="/" className="btn-primary mt-6">Back to homepage</Link>
      </main>
      <SiteFooter />
    </>
  );
}
