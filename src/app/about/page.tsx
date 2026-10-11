import type { Metadata } from "next";
import Image from "next/image";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getSiteSettings } from "@/lib/site-settings";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  const desc = (s.aboutContent || s.tagline).replace(/\s+/g, " ").slice(0, 160);
  return {
    title: `${s.aboutTitle} | ${s.siteName}`,
    description: desc,
    alternates: { canonical: "/about" },
    openGraph: { title: `${s.aboutTitle} | ${s.siteName}`, description: desc },
  };
}

export default async function AboutPage() {
  const s = await getSiteSettings();
  const paragraphs = (s.aboutContent || s.tagline).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <>
      <SiteHeader />
      <main className="container-page py-12 md:py-16">
        <div className={`grid gap-10 ${s.aboutImage ? "md:grid-cols-2 md:items-center" : "max-w-3xl"}`}>
          <div>
            <h1 className="font-display text-3xl text-text-primary sm:text-4xl">{s.aboutTitle}</h1>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-text-secondary">
              {paragraphs.map((p, i) => (
                <p key={i} className="whitespace-pre-line">{p}</p>
              ))}
            </div>
          </div>
          {s.aboutImage && (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-card">
              <Image src={s.aboutImage} alt={s.aboutTitle} fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 560px" />
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
