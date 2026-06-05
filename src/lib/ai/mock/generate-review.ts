import { DEFAULT_DISCLOSURE } from "@/lib/ai/constants";
import { pickReviewTemplate } from "@/lib/ai/prompts/build-prompt";
import { getEditorialImagesForProduct } from "@/lib/reviews/editorial-images";
import type {
  GeneratedReview,
  ReviewGenerationInput,
  ReviewGenerationResult,
} from "@/lib/ai/types";

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function buildMetaDescription(productTitle: string, targetKeyword: string): string {
  let base = `Read our hands-on ${productTitle} review for shoppers researching ${targetKeyword}. We cover pros, cons, and who should buy it.`;

  if (base.length < 120) {
    base = `${base} Updated analysis for buyers who want an honest recommendation before purchasing.`;
  }

  if (base.length > 160) {
    base = `${base.slice(0, 157).trimEnd()}...`;
  }

  return base;
}

function getProductVariant(externalId: string) {
  return externalId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % 3;
}

function buildSectionImageMarkdown(
  images: ReturnType<typeof getEditorialImagesForProduct>,
  index: number,
): string {
  const image = images[index % images.length];
  return `\n\n![${image.alt}](${image.url} "${image.caption ?? image.alt}")\n`;
}

function paragraph(...sentences: string[]): string {
  return sentences.join(" ");
}

export function generateMockReview(
  input: ReviewGenerationInput,
): ReviewGenerationResult {
  const templateId = input.templateId || pickReviewTemplate().id;
  const brand =
    typeof input.product.specs.brand === "string"
      ? input.product.specs.brand
      : "the manufacturer";
  const features = Array.isArray(input.product.specs.features)
    ? input.product.specs.features.map(String)
    : [];
  const color =
    typeof input.product.specs.color === "string"
      ? input.product.specs.color
      : "neutral";
  const featureOne = features[0] ?? "core functionality";
  const featureTwo = features[1] ?? "day-to-day usability";
  const featureThree = features[2] ?? "build quality";
  const priceText = input.product.price
    ? `$${input.product.price}`
    : "the current Amazon price";
  const variant = getProductVariant(input.product.externalId);
  const rating = [4.2, 4.4, 4.6][variant] ?? 4.4;
  const images = getEditorialImagesForProduct({
    externalId: input.product.externalId,
    title: input.product.title,
  });
  const keyword = input.targetKeyword;

  const body = `
## Overview
${paragraph(
  `I tested the ${input.product.title} from ${brand} across several work sessions while researching ${keyword} for a home office upgrade.`,
  `The ${color.toLowerCase()} finish looks clean on a modern desk, but the real test was whether ${featureOne.toLowerCase()}, ${featureTwo.toLowerCase()}, and ${featureThree.toLowerCase()} would stay useful after the first week.`,
  `Most shoppers comparing ${keyword} options are not looking for marketing fluff—they want practical guidance on brightness, beam spread, controls, and whether the price at ${priceText} feels justified.`,
)}
${buildSectionImageMarkdown(images, 0)}
${paragraph(
  `During the first setup session, I paid attention to how quickly I could dial in a comfortable light level for keyboard work, note-taking, and video calls.`,
  `That matters because a ${keyword} purchase usually happens when an existing desk setup feels dim, uneven, or too harsh on the eyes.`,
  `I also tracked glare on the monitor, shadow falloff across the desk, and whether the arm stayed stable when I repositioned the head.`,
)}
${paragraph(
  `Readers searching for the best ${keyword} usually want a clear answer on whether the upgrade is worth it at this price point.`,
  `This review focuses on practical outcomes—comfort, control, and consistency—rather than repeating the spec sheet you can already read on the product page.`,
)}

## What stood out in real use
${paragraph(
  `The ${featureOne.toLowerCase()} was the first thing I noticed after moving from a basic desk light.`,
  `It made it easier to switch between focused task work and wider desk coverage without constantly repositioning the arm.`,
  `That matters if you share a desk or move between laptop and monitor setups during the day.`,
)}
${buildSectionImageMarkdown(images, 1)}
${paragraph(
  `${featureTwo} was the second standout.`,
  `After repeated daily use, the settings felt predictable instead of fiddly.`,
  `I could dial in a warmer tone for late sessions and a cooler tone for morning planning without guessing which button did what.`,
  `For anyone evaluating ${keyword} products, predictable controls are more important than a long list of modes you will never use.`,
)}

## Brightness, color temperature, and glare control
${paragraph(
  `I tested the ${input.product.title} in three common scenarios: morning planning, afternoon deep work, and evening video calls.`,
  `In each case, I noted whether the beam stayed even across the keyboard and side notes without washing out the monitor.`,
  `The ${featureOne.toLowerCase()} helped when I needed a brighter task pool of light, while lower settings were enough for ambient desk work.`,
)}
${buildSectionImageMarkdown(images, 2)}
${paragraph(
  `Color temperature changes were more useful than I expected for ${keyword} shoppers who work past sunset.`,
  `Warmer settings reduced eye strain during long reading blocks, while cooler settings made handwritten notes and printed references easier to scan.`,
  `I did not notice flicker on camera during calls, which is a common failure point for budget LED lamps.`,
)}

## Build, setup, and day-to-day feel
${paragraph(
  `Setup took a few minutes: clamp the base, route the cable, and run through the brightness presets once.`,
  `The ${featureThree.toLowerCase()} feels solid for the price class, and the ${color.toLowerCase()} finish still looked acceptable after regular handling.`,
  `Cable management is simple enough that the lamp does not become the messiest object on the desk.`,
)}
${paragraph(
  `For buyers comparing options around ${priceText}, the practical details decide the purchase.`,
  `This model feels strongest when you want a balanced upgrade rather than a luxury statement piece.`,
  `The beam spread was wide enough for a keyboard and notebook, but not so wide that it washed out my monitor.`,
  `If your priority is ${keyword} performance rather than showroom aesthetics, those practical limits matter more than brand prestige.`,
)}

## How it compares with typical alternatives
${paragraph(
  `Compared with a basic single-brightness lamp, the ${input.product.title} is easier to tune across the day.`,
  `Compared with architect-style lamps costing twice as much, you give up some premium materials and ultra-precise color rendering.`,
  `Compared with relying on overhead room lighting alone, a dedicated ${keyword} gives you control where you actually work.`,
)}
${buildSectionImageMarkdown(images, 3)}
${paragraph(
  `If you already own a monitor light bar, this lamp still earns a place when you need side fill or paper-friendly illumination.`,
  `If you only use a laptop on a couch, a smaller portable light may make more sense.`,
  `The right comparison is not "best lamp on the internet" but "best fit for your desk workflow."`,
)}

## Who it fits best
${paragraph(
  `This is a solid recommendation for remote workers, creators, and anyone building a dedicated workspace around ${keyword}.`,
  `It makes sense if you value ${featureOne.toLowerCase()} and want something that feels considered instead of generic.`,
  `Students, editors, and spreadsheet-heavy roles will appreciate the even task lighting more than occasional users.`,
)}
${paragraph(
  `It is less compelling if you need a flagship experience in every single detail or if you want extensive accessory customization out of the box.`,
  `If your desk already has strong overhead lighting, you may only need a smaller accent lamp instead.`,
  `Buyers who need studio-grade color accuracy for photo or video work should budget higher or add a calibrated monitor workflow.`,
)}

## Value, pricing, and who should wait for a sale
${paragraph(
  `At ${priceText}, the ${input.product.title} sits in the middle of the ${keyword} market rather than at the budget or premium edge.`,
  `That pricing makes sense if you want meaningful upgrades over a bare-bones lamp without paying for designer branding.`,
  `If you only need light for an hour a week, a lower-cost option may be enough; if you work full-time at your desk, the extra presets and build quality are easier to justify.`,
)}
${paragraph(
  `Watch for seasonal Amazon deals, bundle offers, and color variants before buying.`,
  `Availability can shift quickly, so confirm the current price and shipping estimate before you checkout.`,
  `A good ${keyword} should still feel worth the money after thirty days of daily use, not just on unboxing day.`,
)}

## Setup checklist for ${keyword} buyers
${paragraph(
  `Before you buy any ${keyword}, map your desk zones: keyboard, monitor, notebook, and any side tasks like sketching or proofreading.`,
  `Then test whether the lamp arm can reach each zone without blocking your screen or casting shadows on your hands.`,
  `The ${input.product.title} passed that test in my setup, but taller monitor arms or deep desks may need a longer reach than this class typically offers.`,
)}
${paragraph(
  `If you work with printed documents, pay attention to how evenly the light falls on paper at the side of your keyboard.`,
  `If you take frequent video calls, check how the light renders on your face and whether reflections bounce back into the webcam.`,
  `Those two checks separate a useful ${keyword} from one that looks fine in photos but frustrates you daily.`,
)}

## Final rating
${paragraph(
  `After hands-on testing, I would give the ${input.product.title} a **${rating} out of 5**.`,
  `The score reflects meaningful strengths, honest trade-offs, and a price that feels reasonable at ${priceText} for the right buyer.`,
  `It is not perfect, but it solves the everyday ${keyword} problems most readers actually have.`,
)}
${paragraph(
  `If you want a dependable daily desk light with useful presets and a clean footprint, this is an easy recommendation.`,
  `If you need studio-grade color accuracy or premium materials throughout, spend more or look at architect-style lamps instead.`,
)}

## Long-term notes
${paragraph(
  `After several weeks on my desk, the ${input.product.title} remained the kind of upgrade that disappears into the routine—in a good way.`,
  `The brightness presets, arm movement, and light spread stayed consistent, which is what matters once the novelty wears off.`,
  `If you are comparing ${keyword} options, long-term comfort and predictable controls matter more than spec-sheet adjectives.`,
)}
${paragraph(
  `I also kept an eye on glare during video calls and late-night editing sessions.`,
  `The lamp never became the thing I had to fight with, and that reliability is why it still earns a place in this review category.`,
  `For most buyers, that kind of quiet consistency is the difference between a good ${keyword} purchase and an expensive impulse buy.`,
  `When friends ask me what to look for in a ${keyword}, I tell them to prioritize stable brightness steps, sensible color presets, and a footprint that stays out of the way once the lamp is positioned.`,
  `This model checks those boxes well enough that I would recommend it before many cheaper generic lights that look similar in product photos but feel worse after a week.`,
  `That recommendation assumes you actually need a desk-mounted task light rather than whole-room lighting alone.`,
)}

${DEFAULT_DISCLOSURE}
`.trim();

  const pros = [
    `${featureOne} makes a real difference in daily use rather than reading like filler marketing.`,
    `${featureTwo} stayed consistent during repeated testing, which is the main thing I look for in this category.`,
    `${brand} delivers solid value at ${priceText} for shoppers focused on ${keyword}.`,
  ];
  const cons = [
    `${featureThree} is good but not class-leading if you expect a premium flagship experience.`,
    `Some buyers may want more accessory flexibility than this ${color.toLowerCase()} model offers.`,
    `Amazon pricing and availability can change, so confirm the current offer before buying.`,
  ];

  const review: GeneratedReview = {
    title: `${input.product.title} Review: ${keyword}`,
    metaDescription: buildMetaDescription(input.product.title, keyword),
    content: body,
    pros,
    cons,
    rating,
    targetKeyword: keyword,
  };

  if (countWords(body) < 1500) {
    throw new Error(
      `Mock review generator produced ${countWords(body)} words; expected at least 1500.`,
    );
  }

  return {
    review,
    model: "mock-template",
    mode: "mock",
    templateId,
  };
}
