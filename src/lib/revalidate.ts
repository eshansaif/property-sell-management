import { revalidatePath, revalidateTag } from "next/cache";

/** Call after any admin change that affects what visitors see (menu, pages, settings). */
export function refreshPublicSite() {
  revalidateTag("nav-tree");
  revalidateTag("site-settings");
  revalidatePath("/", "layout");
}
