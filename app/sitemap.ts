import type { MetadataRoute } from "next";
import { guides } from "./guides/data";
import { siteUrl } from "./seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/calculators/goal-assets",
    "/calculators/rent-fire",
    "/calculators/job-offer",
    "/calculators/car-cost",
    "/calculators/debt-vs-invest",
    "/calculators/home-purchase",
    "/calculators/investment-compare",
    "/calculators/lump-sum-vs-dca",
    "/calculators/rebalancing",
    "/tools/decision-journal",
    "/invest/quant-backtest",
    "/tools/growth-board",
    "/guides",
    "/about",
    "/privacy",
    "/disclaimer",
    "/terms",
    "/contact",
  ];

  return [
    ...routes.map((route) => ({ url: `${siteUrl}${route}` })),
    ...guides.map((guide) => ({ url: `${siteUrl}/guides/${guide.slug}` })),
  ];
}
