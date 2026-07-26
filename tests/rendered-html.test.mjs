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
  assert.doesNotMatch(`${home}${calculator}${robots}${sitemap}`, /wealth-decision-lab\.pages\.dev/);
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
