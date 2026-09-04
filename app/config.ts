export const analyticsConfig = {
  googleAnalyticsMeasurementId: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_MEASUREMENT_ID ?? "",
  googleAdSensePublisherId:
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUBLISHER_ID?.trim() || "pub-1027745867770826",
  googleSearchConsoleVerification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "",
  naverSearchAdvisorVerification:
    process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION?.trim() ||
    "31e00361a482835254f16bca35248aa71d48c3b6",
  contactEmail:
    process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "privacy@yuubmingulab.com",
};

export const analyticsEvents = [
  "rent_fire_calculated",
  "job_offer_calculated",
  "salary_compound_calculated",
  "result_copied",
  "result_image_saved",
  "related_calculator_clicked",
] as const;
