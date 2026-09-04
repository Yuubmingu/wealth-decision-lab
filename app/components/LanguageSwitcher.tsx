"use client";

import { Languages } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const isEnglish = pathname === "/en" || pathname.startsWith("/en/");

  return (
    <Link
      href={isEnglish ? "/" : "/en"}
      className="language-switch"
      hrefLang={isEnglish ? "ko" : "en"}
      lang={isEnglish ? "ko" : "en"}
      aria-label={isEnglish ? "한국어 홈페이지로 이동" : "Open the native English overview"}
      title={isEnglish ? "한국어 홈페이지" : "English overview · Calculations use South Korean rules"}
    >
      <Languages size={16} aria-hidden="true" />
      <span>{isEnglish ? "KR" : "EN"}</span>
    </Link>
  );
}
