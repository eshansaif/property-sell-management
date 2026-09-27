# Service & Listing Lead Management Platform

A dynamic Service → Sub-service → Listing → Inquiry lead-management platform, built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma, PostgreSQL and NextAuth. Nothing about services, categories or specification fields is hardcoded — everything is admin-configurable through the dashboard.

> **Honest scope note:** this is a solid, working foundation covering the core architecture and primary flows of the original spec (dynamic catalog, dynamic specs, context-aware inquiries, RBAC admin dashboard, SEO basics, security headers). It intentionally does **not** include everything from a 50-point enterprise brief in one pass — no automated test suite, no real file-upload storage (images are URL-based, ready for Vercel Blob/S3), no notification channels, no multi-tenancy. Those are documented as next steps below, matching the original spec's own "don't build every future feature now" guidance (section 42).

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
4. Deploy. The build command (`prisma generate && next build`, see `vercel.json`) handles Prisma client generation automatically.
5. After the first deploy, run migrations against production once, from your machine:
   ```bash
   DATABASE_URL="<production-url>" npx prisma db push
   DATABASE_URL="<production-url>" npm run db:seed   # optional, creates the first super admin
   ```
   (Or use `prisma migrate deploy` with a proper migration history for a real production workflow — `db push` is fine to get started but isn't migration-tracked.)

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

1. **Real image upload** — wire `Vercel Blob` (or S3) into the admin listing form instead of pasting URLs; the API contract (`PUT /api/listings/:id/images`) already expects a list of URLs, so this is a swap at the upload UI, not a schema change.
2. **Automated tests** — Vitest/Playwright for the inquiry submission flow, auth, and RBAC boundaries (the spec's section 44).
3. **Notifications** — email (Resend/SendGrid) on new inquiry; the `Inquiry` creation path in `src/app/api/inquiries/route.ts` is the single place to hook this in.
4. **Search/filtering** — add query-param-driven filtering on `/services/[slug]/[sub]` using the `isFilterable` flag already present on `Specification`.
5. **Rate limiting at scale** — swap the in-memory limiter for `@upstash/ratelimit` once running multi-region.
6. **Full audit log UI** — the `AuditLog` model is already populated on service/listing writes; add an admin screen to browse it.

---

## 6. Default login (after seeding)

Set in `.env` before seeding — do not use the example defaults in production.
```
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="ChangeMe123!"
```
**Change this password immediately after your first login in any real deployment.**
