import { SiteHeaderClient } from "@/components/SiteHeaderClient";
import { getNavTreeSafe } from "@/lib/nav-data";
import { getSiteSettings } from "@/lib/site-settings";

// Server component: fetches the (cached) service tree + site name, hands them to the interactive client header.
export async function SiteHeader() {
  const [tree, settings] = await Promise.all([getNavTreeSafe(), getSiteSettings()]);
  return <SiteHeaderClient siteName={settings.siteName} tree={tree} />;
}
