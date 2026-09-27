import { PrismaClient, SpecFieldType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Super Admin",
      email: adminEmail,
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });
  console.log(`Seeded super admin: ${admin.email}`);

  // ---------------- Land Sale ----------------
  const landSale = await prisma.service.upsert({
    where: { slug: "land-sale" },
    update: {},
    create: {
      name: "Land Sale",
      slug: "land-sale",
      shortDesc: "Residential, commercial and agricultural land opportunities.",
      description: "Browse verified land listings across the city and surrounding areas.",
      status: "PUBLISHED",
      isFeatured: true,
      displayOrder: 1,
      seoTitle: "Land for Sale — Verified Listings",
      seoDescription: "Explore residential, commercial and agricultural land for sale.",
    },
  });

  const residentialLand = await prisma.subService.upsert({
    where: { serviceId_slug: { serviceId: landSale.id, slug: "residential-land" } },
    update: {},
    create: {
      serviceId: landSale.id,
      name: "Residential Land",
      slug: "residential-land",
      shortDesc: "Plots suited for building a home.",
      status: "PUBLISHED",
      displayOrder: 1,
    },
  });

  const specArea = await prisma.specification.upsert({
    where: { subServiceId_key: { subServiceId: residentialLand.id, key: "area" } },
    update: {},
    create: {
      subServiceId: residentialLand.id,
      name: "Area",
      key: "area",
      type: SpecFieldType.MEASUREMENT,
      unit: "katha",
      isRequired: true,
      isFilterable: true,
      displayOrder: 1,
    },
  });
  const specFacing = await prisma.specification.upsert({
    where: { subServiceId_key: { subServiceId: residentialLand.id, key: "facing" } },
    update: {},
    create: {
      subServiceId: residentialLand.id,
      name: "Facing",
      key: "facing",
      type: SpecFieldType.SELECT,
      options: ["North", "South", "East", "West"],
      isFilterable: true,
      displayOrder: 2,
    },
  });
  const specRoad = await prisma.specification.upsert({
    where: { subServiceId_key: { subServiceId: residentialLand.id, key: "road-width" } },
    update: {},
    create: {
      subServiceId: residentialLand.id,
      name: "Road Width",
      key: "road-width",
      type: SpecFieldType.MEASUREMENT,
      unit: "feet",
      displayOrder: 3,
    },
  });

  const landListing = await prisma.listing.upsert({
    where: { slug: "bashundhara-5-katha" },
    update: {},
    create: {
      serviceId: landSale.id,
      subServiceId: residentialLand.id,
      ownerId: admin.id,
      title: "5 Katha Residential Land — Bashundhara",
      slug: "bashundhara-5-katha",
      shortDesc: "South-facing corner plot, ready for construction.",
      description:
        "A well-located 5 katha residential plot in Bashundhara R/A, close to main road access, with clear documentation and immediate registration availability.",
      priceLabel: "Negotiable",
      location: "Bashundhara R/A, Dhaka",
      status: "PUBLISHED",
      isFeatured: true,
      publishedAt: new Date(),
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200", isCover: true, sortOrder: 1, altText: "Open land plot" },
          { url: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200", sortOrder: 2, altText: "Land aerial view" },
        ],
      },
      specs: {
        create: [
          { specificationId: specArea.id, value: "5" },
          { specificationId: specFacing.id, value: "South" },
          { specificationId: specRoad.id, value: "25" },
        ],
      },
    },
  });

  // ---------------- Flat Rent ----------------
  const flatRent = await prisma.service.upsert({
    where: { slug: "flat-rent" },
    update: {},
    create: {
      name: "Flat Rent",
      slug: "flat-rent",
      shortDesc: "Apartments for family, bachelor and office use.",
      status: "PUBLISHED",
      isFeatured: true,
      displayOrder: 2,
    },
  });

  const familyApt = await prisma.subService.upsert({
    where: { serviceId_slug: { serviceId: flatRent.id, slug: "family-apartment" } },
    update: {},
    create: {
      serviceId: flatRent.id,
      name: "Family Apartment",
      slug: "family-apartment",
      status: "PUBLISHED",
      displayOrder: 1,
    },
  });

  const specBed = await prisma.specification.upsert({
    where: { subServiceId_key: { subServiceId: familyApt.id, key: "bedrooms" } },
    update: {},
    create: { subServiceId: familyApt.id, name: "Bedrooms", key: "bedrooms", type: SpecFieldType.NUMBER, isFilterable: true, displayOrder: 1 },
  });
  const specBath = await prisma.specification.upsert({
    where: { subServiceId_key: { subServiceId: familyApt.id, key: "bathrooms" } },
    update: {},
    create: { subServiceId: familyApt.id, name: "Bathrooms", key: "bathrooms", type: SpecFieldType.NUMBER, displayOrder: 2 },
  });
  const specSize = await prisma.specification.upsert({
    where: { subServiceId_key: { subServiceId: familyApt.id, key: "size" } },
    update: {},
    create: { subServiceId: familyApt.id, name: "Size", key: "size", type: SpecFieldType.MEASUREMENT, unit: "sqft", isFilterable: true, displayOrder: 3 },
  });
  const specFurnished = await prisma.specification.upsert({
    where: { subServiceId_key: { subServiceId: familyApt.id, key: "furnished" } },
    update: {},
    create: { subServiceId: familyApt.id, name: "Furnished", key: "furnished", type: SpecFieldType.BOOLEAN, displayOrder: 4 },
  });

  await prisma.listing.upsert({
    where: { slug: "gulshan-3bed-apartment" },
    update: {},
    create: {
      serviceId: flatRent.id,
      subServiceId: familyApt.id,
      ownerId: admin.id,
      title: "3 Bedroom Family Apartment — Gulshan",
      slug: "gulshan-3bed-apartment",
      shortDesc: "Spacious 7th floor apartment with parking.",
      description: "A bright 1,800 sqft apartment in a quiet Gulshan lane, ideal for families, with dedicated parking and 24-hour security.",
      priceLabel: "৳55,000 / month",
      location: "Gulshan-2, Dhaka",
      status: "PUBLISHED",
      isFeatured: true,
      publishedAt: new Date(),
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200", isCover: true, sortOrder: 1, altText: "Apartment living room" },
        ],
      },
      specs: {
        create: [
          { specificationId: specBed.id, value: "3" },
          { specificationId: specBath.id, value: "3" },
          { specificationId: specSize.id, value: "1800" },
          { specificationId: specFurnished.id, value: "true" },
        ],
      },
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
