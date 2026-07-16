import Script from "next/script";
import { analyticsConfig } from "../config";

function normalizeAdSensePublisherId(value: string) {
  const trimmed = value.trim();
  if (/^ca-pub-\d+$/.test(trimmed)) return trimmed;
  if (/^pub-\d+$/.test(trimmed)) return `ca-${trimmed}`;
  return "";
}

export function AnalyticsScripts() {
  const measurementId = analyticsConfig.googleAnalyticsMeasurementId.trim();
  const adSensePublisherId = normalizeAdSensePublisherId(analyticsConfig.googleAdSensePublisherId);

  return (
    <>
      {measurementId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`} strategy="afterInteractive" />
          <Script id="google-analytics" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', ${JSON.stringify(measurementId)}, { anonymize_ip: true });`}</Script>
        </>
      ) : null}
      {adSensePublisherId ? <Script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adSensePublisherId)}`} crossOrigin="anonymous" strategy="afterInteractive" /> : null}
    </>
  );
}
