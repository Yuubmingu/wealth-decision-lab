import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { authorName, breadcrumbSchema, createPageMetadata, pageUrl, serializeJsonLd, siteName, siteUrl } from "../../seo";
import { CompareBarChart, MilestoneStackChart } from "../../components/charts/Charts";
import { getGuide, guides } from "../data";
import { guideCharts } from "../charts";

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

/** 슬러그에 맞는 차트를 고릅니다. 차트가 없는 글은 아무것도 그리지 않습니다. */
function GuideChartBlock({ slug }: { slug: string }) {
  const chart = guideCharts[slug];
  if (!chart) return null;
  return chart.kind === "milestones"
    ? <MilestoneStackChart title={chart.title} caption={chart.caption} data={chart.data} principalLabel={chart.principalLabel} profitLabel={chart.profitLabel} />
    : <CompareBarChart title={chart.title} caption={chart.caption} data={chart.data} unit={chart.unit} valueLabel={chart.valueLabel} />;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  return createPageMetadata({
    title: guide?.title ?? "가이드",
    description: guide?.summary ?? "회사원의 재무 의사결정을 위한 숫자와 체크리스트를 정리합니다.",
    path: `/guides/${slug}`,
    openGraphType: "article",
    publishedTime: guide?.publishedAt,
    modifiedTime: guide?.reviewedAt,
  });
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const guideUrl = pageUrl(`/guides/${guide.slug}`);
  const websiteUrl = pageUrl("/");
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.summary,
    url: guideUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": guideUrl },
    datePublished: guide.publishedAt,
    dateModified: guide.reviewedAt,
    image: { "@type": "ImageObject", url: `${siteUrl}/og.png`, width: 1200, height: 630 },
    // 글을 쓴 사람을 사이트 자체가 아니라 일관된 필명으로 표시합니다.
    author: { "@type": "Person", name: authorName, url: pageUrl("/about") },
    publisher: { "@type": "Organization", name: siteName, url: websiteUrl },
    articleSection: guide.category,
    citation: guide.sources.map((source) => source.url),
    inLanguage: "ko-KR",
    isPartOf: { "@type": "WebSite", name: siteName, url: websiteUrl },
  };
  const serializedArticleSchema = serializeJsonLd(articleSchema);
  const serializedBreadcrumb = serializeJsonLd(breadcrumbSchema([
    { name: "가이드", path: "/guides" },
    { name: guide.title, path: `/guides/${guide.slug}` },
  ]));

  return (
    <main>
      <article className="shell guide-article" aria-labelledby="guide-title">
        <Link href="/guides" className="back-link"><ArrowLeft size={16} aria-hidden="true" /> 가이드 목록</Link>
        <header>
          <p className="eyebrow">{guide.category} · FIELD NOTE</p>
          <h1 id="guide-title">{guide.title}</h1>
          <p>{guide.summary}</p>
          <dl className="guide-meta">
            <div><dt>작성</dt><dd><Link href="/about">{authorName}</Link></dd></div>
            <div><dt>발행</dt><dd><time dateTime={guide.publishedAt}>{guide.publishedAt}</time></dd></div>
            <div><dt>최근 검토</dt><dd><time dateTime={guide.reviewedAt}>{guide.reviewedAt}</time></dd></div>
            <div><dt>검토 범위</dt><dd>공식 출처·계산 가정</dd></div>
          </dl>
          <p className="review-scope">외부 금융·세무 전문가의 개별 감수가 아닌 운영자의 자료 검토입니다. 규정이 관련된 결정은 최신 원문을 다시 확인하세요.</p>
        </header>

        <div className="article-body">
          {guide.fieldNote ? (
            <section className="guide-field-note" aria-labelledby="field-note-heading">
              <p className="eyebrow">FIRST-HAND NOTE · 직접 경험</p>
              <h2 id="field-note-heading">{guide.fieldNote.heading}</h2>
              {guide.fieldNote.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ) : null}

          {guide.sections.map((section, index) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.checklist ? <ul>{section.checklist.map((item) => <li key={item}>{item}</li>)}</ul> : null}
              {/* 도입부를 읽고 난 자리에 그림을 둡니다. 맨 위에 두면 맥락 없이 숫자만 보게 됩니다. */}
              {index === 1 ? <GuideChartBlock slug={guide.slug} /> : null}
            </section>
          ))}

          <section className="guide-examples" aria-labelledby="example-heading">
            <h2 id="example-heading">숫자로 다시 보는 가상 예시</h2>
            <p className="example-notice"><strong>아래 인물과 상황은 설명을 위해 만든 가상 사례입니다.</strong> 운영자나 실제 이용자의 경험·성과가 아니며, 계산값은 반올림과 납입 시점에 따라 달라질 수 있습니다.</p>
            <div className="example-grid">
              {guide.examples.map((example) => (
                <article key={example.title}>
                  <h3>{example.title}</h3>
                  <p>{example.setup}</p>
                  <p className="example-calculation"><strong>계산:</strong> {example.calculation}</p>
                  <p><strong>해석:</strong> {example.interpretation}</p>
                </article>
              ))}
            </div>
          </section>

          <blockquote>{guide.takeaway}</blockquote>

          <section aria-labelledby="scope-heading">
            <h2 id="scope-heading">이 글이 다루지 않는 것</h2>
            <p>{guide.scopeNote}</p>
            <p>계산 결과는 입력한 가정에 따른 시뮬레이션이며 개인별 자문이 아닙니다. 전체 범위는 <Link href="/disclaimer">금융정보 면책</Link>에서 확인하실 수 있습니다.</p>
          </section>

          <section className="guide-sources" aria-labelledby="sources-heading">
            <h2 id="sources-heading">검토한 공식·공공 출처</h2>
            <p>최근 내용 검토일은 <time dateTime={guide.reviewedAt}>{guide.reviewedAt}</time>입니다. 링크된 자료의 개정일과 적용 대상을 실제 결정 시점에 다시 확인하세요.</p>
            <ol>
              {guide.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer">
                    <span>{source.publisher} · {source.title}</span><ExternalLink size={14} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ol>
          </section>

          <Link href={guide.calculator.href} className="related-link">{guide.calculator.label}로 숫자 비교하기</Link>
        </div>
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializedArticleSchema }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializedBreadcrumb }} />
    </main>
  );
}
