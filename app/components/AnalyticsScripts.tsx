"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { analyticsConfig } from "../config";

const CONSENT_KEY = "wdl_optional_analytics_consent_v1";
type ConsentState = "unknown" | "granted" | "denied";

function normalizeGoogleAnalyticsMeasurementId(value: string) {
  const trimmed = value.trim().toUpperCase();
  return /^G-[A-Z0-9]+$/.test(trimmed) ? trimmed : "";
}

function hasValidContactEmail(value: string) {
  const trimmed = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) && !/[\r\n]/.test(trimmed);
}

function removeGoogleAnalyticsCookies() {
  try {
    const hostname = window.location.hostname.toLowerCase();
    const domainCandidates = new Set<string>();
    if (/^[a-z0-9.-]+$/.test(hostname)) {
      domainCandidates.add(hostname);
      domainCandidates.add(`.${hostname}`);
      if (hostname.startsWith("www.")) {
        const apex = hostname.slice(4);
        domainCandidates.add(apex);
        domainCandidates.add(`.${apex}`);
      }
    }

    for (const entry of document.cookie.split(";")) {
      const cookieName = entry.split("=")[0]?.trim();
      const isAnalyticsCookie = cookieName === "_ga" || cookieName === "_gid" || cookieName === "AMP_TOKEN" ||
        cookieName?.startsWith("_ga_") || cookieName?.startsWith("_gat_") || cookieName?.startsWith("_gac_");
      if (!cookieName || !isAnalyticsCookie) continue;
      const expiration = "Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax";
      document.cookie = `${cookieName}=; ${expiration}`;
      for (const domain of domainCandidates) {
        document.cookie = `${cookieName}=; ${expiration}; Domain=${domain}`;
      }
    }
  } catch {
    // Cookie access may be blocked; analytics remains disabled even if cleanup cannot be verified.
  }
}

export function AnalyticsScripts() {
  const configuredMeasurementId = normalizeGoogleAnalyticsMeasurementId(analyticsConfig.googleAnalyticsMeasurementId);
  const privateContactReady = hasValidContactEmail(analyticsConfig.contactEmail);
  const measurementId = privateContactReady ? configuredMeasurementId : "";
  const [consent, setConsent] = useState<ConsentState>("unknown");
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    if (!measurementId) {
      removeGoogleAnalyticsCookies();
      return;
    }
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(CONSENT_KEY);
        if (saved === "granted" || saved === "denied") setConsent(saved);
        else setShowPreferences(true);
      } catch {
        // Storage may be blocked. In that case, keep analytics disabled and ask again next visit.
        setShowPreferences(true);
      } finally {
        setPreferencesReady(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [measurementId]);

  function saveConsent(nextConsent: Exclude<ConsentState, "unknown">) {
    setConsent(nextConsent);
    setShowPreferences(false);
    if (nextConsent === "denied") {
      const analyticsWindow = window as Window & { gtag?: (...args: unknown[]) => void };
      analyticsWindow.gtag?.("consent", "update", { analytics_storage: "denied" });
      removeGoogleAnalyticsCookies();
    }
    try {
      window.localStorage.setItem(CONSENT_KEY, nextConsent);
    } catch {
      // Consent still applies to this page even if the browser blocks persistent storage.
    }
  }

  if (!measurementId) return null;

  return (
    <>
      {preferencesReady && showPreferences ? (
        <aside className="analytics-consent" aria-labelledby="analytics-consent-title" aria-live="polite">
          <div>
            <strong id="analytics-consent-title">선택적 이용통계</strong>
            <p>동의하면 사이트 개선을 위해 방문 페이지, 대략적인 지역, 기기·브라우저 정보와 정해진 이용 동작이 HTTPS로 Google LLC(미국 등 Google의 글로벌 인프라)에 전송될 수 있습니다. 계산기에 입력한 금액과 메모는 보내지 않으며, 거부해도 모든 계산기를 사용할 수 있습니다. 보유 기준과 국외 처리 내용은 방침에서 확인할 수 있고 이 선택창은 광고용 인증 CMP가 아닙니다.</p>
            <Link href="/privacy">개인정보처리방침 보기</Link>
          </div>
          <div className="consent-actions">
            <button type="button" onClick={() => saveConsent("denied")}>거부</button>
            <button type="button" className="consent-accept" onClick={() => saveConsent("granted")}>동의</button>
          </div>
        </aside>
      ) : null}

      {preferencesReady && !showPreferences && consent !== "unknown" ? (
        <button type="button" className="privacy-settings-trigger" onClick={() => setShowPreferences(true)} aria-label="선택적 이용통계 설정 다시 열기">분석 설정</button>
      ) : null}

      {consent === "granted" ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`} strategy="afterInteractive" />
          <Script id="google-analytics" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }); gtag('js', new Date()); gtag('config', ${JSON.stringify(measurementId)}, { anonymize_ip: true });`}</Script>
        </>
      ) : null}
    </>
  );
}
