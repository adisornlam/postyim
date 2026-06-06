export interface EditorialImage {
  url: string;
  alt: string;
  caption?: string;
}

const DESK_LAMP_IMAGES: EditorialImage[] = [
  {
    url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80",
    alt: "Modern LED desk lamp on a home office desk",
    caption: "The LumenArc lamp in a typical standing-desk setup.",
  },
  {
    url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80",
    alt: "Desk lamp illuminating a keyboard and notebook",
    caption: "Warm color temperature helps reduce eye strain during evening work.",
  },
  {
    url: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1200&q=80",
    alt: "Minimal desk setup with task lighting",
    caption: "A balanced beam spread keeps the monitor and keyboard evenly lit.",
  },
  {
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    alt: "Bright modern office desk with task light",
    caption: "Daytime testing showed good contrast without washing out the screen.",
  },
  {
    url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80",
    alt: "Close-up of a desk workspace with keyboard",
    caption: "The slim profile stays out of the way during height adjustments.",
  },
];

const OFFICE_IMAGES: EditorialImage[] = [
  {
    url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
    alt: "Ergonomic home office setup",
    caption: "Tested in a dedicated home office environment.",
  },
  {
    url: "https://images.unsplash.com/photo-1487014679447-9f8336841d58?auto=format&fit=crop&w=1200&q=80",
    alt: "Desk workspace close-up",
    caption: "Day-to-day usability matters more than spec-sheet promises.",
  },
];

function imagesForProduct(input: {
  externalId?: string | null;
  title: string;
}): EditorialImage[] {
  const externalId = input.externalId?.toUpperCase() ?? "";
  const title = input.title.toLowerCase();

  if (externalId.includes("LAMP") || /\blamp\b/.test(title)) {
    return DESK_LAMP_IMAGES;
  }

  if (
    externalId.includes("DESK") ||
    (/\bdesk\b/.test(title) && !/\blamp\b/.test(title))
  ) {
    return OFFICE_IMAGES;
  }

  if (externalId.includes("CHAIR") || /\bchair\b/.test(title)) {
    return [
      {
        url: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=1200&q=80",
        alt: "Ergonomic office chair at a desk",
        caption: "Evaluated during long work sessions.",
      },
      ...OFFICE_IMAGES,
    ];
  }

  return OFFICE_IMAGES;
}

export function getEditorialImagesForProduct(input: {
  externalId?: string | null;
  title: string;
}): EditorialImage[] {
  const fromCatalog = imagesForProduct(input);

  return fromCatalog.map((image) => ({
    ...image,
    alt: image.alt.includes(input.title)
      ? image.alt
      : `${image.alt} — ${input.title}`,
  }));
}

export function getHeroGalleryImages(
  images: EditorialImage[],
  limit = 3,
): EditorialImage[] {
  return images.slice(0, limit);
}
