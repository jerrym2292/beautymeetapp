import { ScrapflyClient, ScrapeConfig } from "scrapfly-sdk";
import { prisma } from "./prisma";

function getScrapflyClient() {
  const key = process.env.SCRAPFLY_API_KEY;
  if (!key) {
    // Important: do NOT instantiate ScrapflyClient at module load time.
    // Next.js may evaluate this file during build/route collection.
    throw new Error("SCRAPFLY_API_KEY is not set");
  }
  return new ScrapflyClient({ key });
}

export async function syncInstagramPortfolio(providerId: string, instagramHandle: string) {
  const handle = instagramHandle.replace("@", "").trim();
  if (!handle) return;

  try {
    // We use Scrapfly to scrape the public profile page
    const scrapfly = getScrapflyClient();

    const result = await scrapfly.scrape(new ScrapeConfig({
      url: `https://www.instagram.com/${handle}/`,
      asp: true,
      render_js: true,
    }));

    // Simple regex to find sharedData image URLs - a real implementation would use a more robust parser
    // or Scrapfly's extraction rules, but this is the MVP pattern.
    const html = result.result.content;
    const imageUrls = [...html.matchAll(/"display_url":"([^"]+)"/g)]
      .map(m => m[1].replace(/\\u0026/g, "&"))
      .slice(0, 12); // Take top 12

    if (imageUrls.length > 0) {
      await prisma.provider.update({
        where: { id: providerId },
        data: {
          portfolioUrlsJson: JSON.stringify(imageUrls),
          instagram: handle
        }
      });
      return { success: true, count: imageUrls.length };
    }
    
    return { success: false, error: "No images found. Is the profile private?" };
  } catch (error: any) {
    console.error("Insta sync error:", error);
    return { success: false, error: error.message };
  }
}
