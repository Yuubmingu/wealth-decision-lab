export const analyticsConfig = {
  googleAnalyticsMeasurementId: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_MEASUREMENT_ID ?? "",
  googleAdSensePublisherId: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUBLISHER_ID ?? "",
  googleSearchConsoleVerification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
};

export const analyticsEvents = [
  "rent_fire_calculated",
  "job_offer_calculated",
  "salary_compound_calculated",
  "result_copied",
  "result_image_saved",
  "related_calculator_clicked",
] as const;
