"use client";

import { Languages } from "lucide-react";

const siteUrl = "https://yuubmingulab.com/";

function englishTranslationUrl(url: string) {
  return `https://translate.google.com/translate?sl=ko&tl=en&u=${encodeURIComponent(url)}`;
}

export function LanguageSwitcher() {
  function openEnglishVersion() {
    const currentUrl = new URL(window.location.href || siteUrl);
    currentUrl.search = "";
    currentUrl.hash = "";
    window.open(englishTranslationUrl(currentUrl.toString()), "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      className="language-switch"
      lang="en"
      onClick={openEnglishVersion}
      aria-label="Open this page in English using automatic translation"
      title="English · Automatic translation · Korean financial rules"
    >
      <Languages size={16} aria-hidden="true" />
      <span>EN</span>
      <small>Auto</small>
    </button>
  );
}
