import { config } from "dotenv";

config({ path: ".env.local" });
config();

import { eq } from "drizzle-orm";

import { authors, campaigns, categories } from "@/db/schema";

import { db } from "./index";

async function seed() {
  console.log("Seeding development data...");

  const [category] = await db
    .insert(categories)
    .values({
      slug: "home-office",
      name: "Home Office",
      description: "Desks, chairs, and workspace gear for remote professionals.",
    })
    .onConflictDoUpdate({
      target: categories.slug,
      set: {
        name: "Home Office",
        description:
          "Desks, chairs, and workspace gear for remote professionals.",
        updatedAt: new Date(),
      },
    })
    .returning();

  await db
    .insert(authors)
    .values({
      slug: "sarah-chen",
      name: "Sarah Chen",
      title: "Ergonomics Specialist",
      bio: "Sarah has spent 12 years optimizing home workspaces for remote professionals.",
      credentials: [
        "Certified Ergonomics Assessment Specialist",
        "12 years remote work experience",
      ],
    })
    .onConflictDoNothing({ target: authors.slug });

  await db
    .insert(campaigns)
    .values({
      name: "Home Office Essentials",
      slug: "home-office-essentials",
      categoryId: category.id,
      affiliateNetwork: "amazon",
      status: "active",
      keywords: [
        "standing desk",
        "ergonomic office chair",
        "desk lamp",
      ],
      config: {
        searchIndex: "HomeGarden",
        minPrice: 50,
        maxPrice: 600,
        itemCount: 5,
      },
      dailyProductLimit: 10,
      priority: 10,
    })
    .onConflictDoUpdate({
      target: campaigns.slug,
      set: {
        name: "Home Office Essentials",
        categoryId: category.id,
        status: "active",
        keywords: [
          "standing desk",
          "ergonomic office chair",
          "desk lamp",
        ],
        config: {
          searchIndex: "HomeGarden",
          minPrice: 50,
          maxPrice: 600,
          itemCount: 5,
        },
        dailyProductLimit: 10,
        priority: 10,
        updatedAt: new Date(),
      },
    });

  const seededCampaign = await db
    .select({ id: campaigns.id, slug: campaigns.slug })
    .from(campaigns)
    .where(eq(campaigns.slug, "home-office-essentials"))
    .limit(1);

  console.log("Seed complete.");
  console.log("Campaign:", seededCampaign[0]);
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
