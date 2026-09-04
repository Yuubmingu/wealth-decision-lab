import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders production pages without development preview metadata", async () => {
  const home = await readFile(new URL("../dist/client/index.html", import.meta.url), "utf8");
  const calculator = await readFile(
    new URL("../dist/client/calculators/home-purchase/index.html", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(home, developmentPreviewMeta);
  assert.match(home, /부자 회사원의 의사결정 연구소/);
  assert.match(calculator, /내 집 마련 필요현금 계산기/);
  assert.match(home, /Open the native English overview/);
  assert.doesNotMatch(home, /translate\.google\.com|translate\.goog/);
});

test("publishes a native English overview without claiming the calculators are translated", async () => {
  const koreanHome = await readFile(
    new URL("../dist/client/index.html", import.meta.url),
    "utf8",
  );
  const englishHome = await readFile(
    new URL("../dist/client/en/index.html", import.meta.url),
    "utf8",
  );

  assert.match(englishHome, /Turn today(?:&#x27;|&apos;|')s choice/);
  assert.match(englishHome, /calculator interfaces and detailed sources are currently in Korean/i);
  assert.match(englishHome, /South Korean rules/);
  assert.match(englishHome, /aria-label="한국어 홈페이지로 이동"/);
  for (const page of [koreanHome, englishHome]) {
    assert.match(page, /<link(?=[^>]*rel="alternate")(?=[^>]*hreflang="ko-KR")(?=[^>]*href="https:\/\/yuubmingulab\.com\/")[^>]*>/i);
    assert.match(page, /<link(?=[^>]*rel="alternate")(?=[^>]*hreflang="en")(?=[^>]*href="https:\/\/yuubmingulab\.com\/en\/")[^>]*>/i);
    assert.match(page, /<link(?=[^>]*rel="alternate")(?=[^>]*hreflang="x-default")(?=[^>]*href="https:\/\/yuubmingulab\.com\/")[^>]*>/i);
  }
});

test("uses the custom domain for canonical URLs and discovery files", async () => {
  const home = await readFile(new URL("../dist/client/index.html", import.meta.url), "utf8");
  const calculator = await readFile(
    new URL("../dist/client/calculators/home-purchase/index.html", import.meta.url),
    "utf8",
  );
  const robots = await readFile(new URL("../dist/client/robots.txt", import.meta.url), "utf8");
  const sitemap = await readFile(new URL("../dist/client/sitemap.xml", import.meta.url), "utf8");

  assert.match(home, /rel="canonical" href="https:\/\/yuubmingulab\.com\/"/);
  assert.match(calculator, /rel="canonical" href="https:\/\/yuubmingulab\.com\/calculators\/home-purchase\/"/);
  assert.match(robots, /Sitemap: https:\/\/yuubmingulab\.com\/sitemap\.xml/);
  assert.match(sitemap, /https:\/\/yuubmingulab\.com\/calculators\/home-purchase/);
  assert.match(sitemap, /https:\/\/yuubmingulab\.com\/en\//);
  assert.doesNotMatch(`${home}${calculator}${robots}${sitemap}`, /wealth-decision-lab\.pages\.dev/);
});

test("renders the Naver Search Advisor ownership verification tag", async () => {
  const home = await readFile(new URL("../dist/client/index.html", import.meta.url), "utf8");

  assert.match(
    home,
    /<meta(?=[^>]*name="naver-site-verification")(?=[^>]*content="31e00361a482835254f16bca35248aa71d48c3b6")[^>]*>/,
  );
});

test("publishes the authorized AdSense seller record at the site root", async () => {
  const ads = await readFile(new URL("../dist/client/ads.txt", import.meta.url), "utf8");

  assert.equal(
    ads.trim(),
    "google.com, pub-1027745867770826, DIRECT, f08c47fec0942fa0",
  );
});

test("production worker delegates requests to static assets", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  let requestedUrl = "";

  const response = await worker.fetch(new Request("https://example.com/calculators/home-purchase/"), {
    ASSETS: {
      fetch: async (request) => {
        requestedUrl = request.url;
        return new Response("static response", { status: 200 });
      },
    },
  });

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "static response");
  assert.equal(requestedUrl, "https://example.com/calculators/home-purchase/");
});

test("quick calculators expose conservative assumptions without hidden comparison scores", async () => {
  const homePurchase = await readFile(
    new URL("../dist/client/calculators/home-purchase/index.html", import.meta.url),
    "utf8",
  );
  const investmentCompare = await readFile(
    new URL("../dist/client/calculators/investment-compare/index.html", import.meta.url),
    "utf8",
  );

  assert.match(homePurchase, /기존 대출 이자를 모르면 월 상환액 전부를 이자로 보수적으로 반영/);
  assert.match(investmentCompare, /예상자산·손실 중심 비교/);
  assert.match(investmentCompare, /비교지수는 상세 계산에서만 표시/);
  assert.doesNotMatch(investmentCompare, /비교지수 \d+(?:\.\d+)?/);
});
