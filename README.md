# Service & Listing Lead Management Platform

A dynamic Service → Sub-service → Listing → Inquiry lead-management platform, built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma, PostgreSQL and NextAuth. Nothing about services, categories or specification fields is hardcoded — everything is admin-configurable through the dashboard.

> **Honest scope note:** this is a solid, working foundation covering the core architecture and primary flows of the original spec (dynamic catalog, dynamic specs, context-aware inquiries, RBAC admin dashboard, SEO basics, security headers). It intentionally does **not** include everything from a 50-point enterprise brief in one pass — no automated test suite, no notification channels, no multi-tenancy. Those are documented as next steps below, matching the original spec's own "don't build every future feature now" guidance (section 42).

---

## 1. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR/ISR, file-based routing, API routes, Vercel-native |
| Language | TypeScript (strict) | Type safety across API and UI |
| Styling | Tailwind CSS | Fast, consistent design-token system |
| Database | PostgreSQL | Relational integrity for the catalog/lead model |
| ORM | Prisma | Type-safe queries, migrations |
| Auth | NextAuth (Credentials + JWT) | Simple, secure session handling for admin users |
| Validation | Zod | Shared, strict server-side validation |

All dependencies are pinned to current, patched major/minor lines. **Next.js is pinned to `^14.2.25` or higher specifically to avoid CVE-2025-29927** (a critical middleware auth-bypass vulnerability in earlier 14.x releases) — this matters because this app uses middleware for admin auth.

---

## 2. Local setup

```bash
npm install
cp .env.example .env
# edit .env — at minimum set DATABASE_URL and NEXTAUTH_SECRET
npx prisma db push      # create tables from schema.prisma
npm run db:seed         # creates a super admin + example services/listings
npm run dev
```

Generate a secret for `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

Visit:
- Public site: http://localhost:3000
- Admin: http://localhost:3000/admin/login (use `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `.env`)

You need a real PostgreSQL database even for local dev — the easiest options are a free [Neon](https://neon.tech) or [Vercel Postgres](https://vercel.com/storage/postgres) instance, or a local Postgres via Docker:
```bash
docker run --name platform-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
```

---

## 3. Deploying to Vercel

1. Push this project to a GitHub/GitLab/Bitbucket repo.
2. In Vercel, "Add New Project" → import the repo. Framework preset auto-detects Next.js.
3. Add environment variables in Vercel's Project Settings → Environment Variables:
   - `DATABASE_URL` — your production Postgres connection string (Neon/Vercel Postgres/Supabase all work)
   - `NEXTAUTH_SECRET` — a fresh secret (don't reuse the local one)
   - `NEXTAUTH_URL` — your production URL, e.g. `https://yourdomain.com`
   - `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_SITE_URL`
   - `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` (only needed if you run the seed against prod)
4. **Create the database schema before the first deploy** (the homepage is prerendered at build time and needs the tables to exist). From your machine:
   ```bash
   DATABASE_URL="<production-url>" npx prisma db push
   DATABASE_URL="<production-url>" npm run db:seed   # optional: creates the first super admin + demo content
   ```
   (For a team workflow, switch to `prisma migrate deploy` with tracked migrations — `db push` is fine to get started.)
5. Deploy. The build command (`prisma generate && next build`, see `vercel.json`) generates the Prisma client automatically.
6. Attach a **Blob store** to the project (Storage tab) so image uploads work — see section 6.

---

## 4. Architecture notes

### Dynamic catalog & specifications
`Service → SubService → Listing` is a plain relational hierarchy. What makes it dynamic is the `Specification` model: an admin defines fields (name, type, unit, options) at the Service or SubService level, and every `Listing` under that category stores its values in `ListingSpecificationValue`. Adding "Floor Number" to Flat Rent or removing "Facing" from Land Sale requires zero code changes — just admin dashboard actions.

### RBAC
Every admin API route calls `can(session.user.role, "permission:action")` from `src/lib/rbac.ts` before doing anything — permissions are never checked only in the UI. Add new roles/permissions in one place (`rbac.ts`) rather than scattering role checks through routes.

### Context-aware inquiries
`InquiryForm` accepts optional `serviceId` / `subServiceId` / `listingId` props. Each page passes only what it knows: the homepage passes nothing, a service page passes `serviceId`, a listing page passes all three. The visitor never re-enters information the page already knows. The API additionally re-resolves `serviceId`/`subServiceId` from the listing server-side, so a tampered client payload can't misattribute a lead.

### Security
- Every write endpoint validates with Zod and checks RBAC server-side.
- The public inquiry endpoint has an IP rate limiter (in-memory; swap for Upstash Redis at scale — see `src/lib/rate-limit.ts`) and a honeypot field.
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`, etc.) are set in `next.config.mjs`.
- `/admin` is `noindex` and protected by middleware-enforced auth (patched Next.js version, see above).
- Deleting a Service/SubService/Listing that already has data archives it instead of hard-deleting, so historical inquiries stay intact.

### SEO
Dynamic `generateMetadata` on service/sub-service/listing pages, JSON-LD (`Product`, `BreadcrumbList`, `Service`), `sitemap.ts`, `robots.ts`, clean slug-based URLs, `noindex` on admin routes.

---

## 5. What to build next (in priority order)

1. ~~Real image upload~~ (done) — wire `Vercel Blob` (or S3) into the admin listing form instead of pasting URLs; the API contract (`PUT /api/listings/:id/images`) already expects a list of URLs, so this is a swap at the upload UI, not a schema change.
2. **Automated tests** — Vitest/Playwright for the inquiry submission flow, auth, and RBAC boundaries (the spec's section 44).
3. **Notifications** — email (Resend/SendGrid) on new inquiry; the `Inquiry` creation path in `src/app/api/inquiries/route.ts` is the single place to hook this in.
4. **Search/filtering** — add query-param-driven filtering on `/services/[slug]/[sub]` using the `isFilterable` flag already present on `Specification`.
5. **Rate limiting at scale** — swap the in-memory limiter for `@upstash/ratelimit` once running multi-region.
6. **Full audit log UI** — the `AuditLog` model is already populated on service/listing writes; add an admin screen to browse it.

---

## 6. Image uploads (Vercel Blob, swappable later)

Listing images are uploaded through `/api/upload`, which goes through a storage abstraction in `src/lib/storage.ts` — nothing else in the app talks to a storage SDK directly. Today it's wired to **Vercel Blob**:

- On Vercel: attach a Blob store to your project (Storage tab → Create Database → Blob). `BLOB_READ_WRITE_TOKEN` is injected automatically — no extra config.
- Locally: create a Blob store at vercel.com/storage, copy its token into `.env` as `BLOB_READ_WRITE_TOKEN`.

To move to S3, Cloudinary, R2, or anything else later: add a branch in `uploadFile()`/`deleteFile()` in `src/lib/storage.ts` and set `STORAGE_PROVIDER` in env. The admin UI (`ImageUploader` component — drag-and-drop, multi-file, progress, drag-to-reorder, first image = cover) never needs to change.

## 7. Search, filtering & pagination

- **Public site**: the homepage search bar and `/services` search both query by name/description server-side. Each sub-service page auto-derives its available filters from that category's `isFilterable` specifications (e.g. "Bedrooms", "Facing") — the dropdown options are the distinct values actually in use, so filters never show empty or irrelevant choices for a category. All of it is URL-driven (`?q=`, `?spec_<id>=value`, `?page=`), so results are shareable, bookmarkable and back-button-safe, and pagination links are real `<a>` tags for SEO crawlability.
- **Admin dashboard**: every list (services, sub-services, listings, inquiries) has debounced search, real pagination, and status/category filters — the service and sub-service pickers use the searchable `Combobox` component instead of plain `<select>` dropdowns once a list could realistically grow long.

## 8. Mobile & navigation

- The public header collapses into an animated hamburger menu with a slide-down panel below `md` breakpoint; the admin sidebar becomes a slide-in drawer with a backdrop on mobile.
- All admin list-to-detail navigation uses Next's client-side router (`router.push` / `Link`) — there is no `window.location` hard navigation anywhere in the app, so moving between admin screens never full-page-reloads.
- Every data-fetching view (public listing pages via `loading.tsx`, admin lists via inline skeletons) shows a skeleton matching its final layout instead of a spinner or blank flash.

## 9. Specifications (dynamic listing fields)

Admin → **Specifications** lets you define any number of fields — like product attributes in an e-commerce catalog — with no code changes:

| Field type | Admin enters | Public page shows |
|---|---|---|
| Text | free text | as typed |
| Number | number (+ optional unit) | `3`, `1,800 sqft` |
| Measurement | number + unit | `5 katha` |
| Currency | amount + currency label | `BDT 55,000` |
| Yes / No | dropdown | ✓ Yes / ✕ No |
| Single choice | pick from the options you define | the selected option |
| Multiple choice | tick several options | tags |

- **Scope**: attach a spec to an *entire service* (every sub-service under it inherits it) or to *one sub-service*.
- **Options**: for choice types, add options as chips (press Enter, or paste comma-separated).
- **Use as public filter**: visitors can filter that category by this field; the filter dropdown lists only values that actually exist.
- **Required**: enforced on the client *and* server when a listing is published.
- **Display order**: controls the order in the listing form and the public spec table.
- Editing a spec's name/options/type is safe; deleting one removes its stored values from listings (you'll get a warning with the usage count).

On the public listing page, specs render as a standard spec-sheet table (label / value rows, semantic `<table>` markup for accessibility) and are also emitted as schema.org `additionalProperty` structured data.

## 10. Navigation, "All Listings" & naming

- **Mega menu**: hovering *Services* in the header opens a two-column category tree (services on the left, their sub-services on the right) — like an e-commerce category menu. On mobile it becomes an accordion inside the hamburger panel. The tree is cached and refreshed instantly whenever an admin edits a service/sub-service.
- **All Listings** (`/listings`): one page to search everything, filter by service → category → category-specific filters, sort and paginate. Filtered/sorted URLs are `noindex` and canonicalise to `/listings`.
- **One place for names**: `src/lib/labels.ts` holds the menu/page names ("All Listings", "Services"…). Rename there and it changes on the public site and in the admin.

## 11. Team, settings & security

- **Settings → My profile / Password / Team / Site settings.** Admins can add other admins and staff, change roles, reset passwords (server-generated, shown once) and deactivate people.
- Rules: Admins can manage Admin/Staff only; only Super Admins can create or manage Super Admins; nobody can demote/deactivate themselves; at least one active Super Admin always remains.
- Deactivation/role changes take effect immediately (the session re-checks the database), not after the 8-hour token expires.
- Password policy: 10–72 chars with a letter and a number. Login and password-change attempts are rate limited (in-memory per instance; swap for Upstash Redis when you scale out).
- **Site settings** (name, tagline, contact, social links) feed the header, footer, page titles and SEO defaults.

## 12. Notifications (toasts)

Every action gives feedback: saves, deletes/archives, uploads, status changes, assignments, notes, login, password/profile/team/settings changes, and public inquiry submission. Network failures are caught (`src/lib/safe-fetch.ts`) and shown as readable errors instead of failing silently. Toasts pause on hover, are announced to screen readers, and respect reduced-motion.

## 13. User manual

`public/manual.html` (served at `/manual.html`, linked as **Help** in the admin header) is a printable Bangla guide covering every screen, the two ways to add specifications, roles, and troubleshooting. Use the browser's Print → Save as PDF to share it.

## 14. Default login (after seeding)

Set in `.env` before seeding — do not use the example defaults in production.
```
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="ChangeMe123!"
```
**Change this password immediately after your first login in any real deployment.**
