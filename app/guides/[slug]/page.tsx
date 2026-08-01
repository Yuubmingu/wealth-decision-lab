import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { createPageMetadata, pageUrl, siteName, siteUrl } from "../../seo";
import { getGuide, guides } from "../data";

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
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
    author: { "@type": "Organization", name: siteName, url: pageUrl("/about") },
    publisher: { "@type": "Organization", name: siteName, url: websiteUrl },
    articleSection: guide.category,
    citation: guide.sources.map((source) => source.url),
    inLanguage: "ko-KR",
    isPartOf: { "@type": "WebSite", name: siteName, url: websiteUrl },
  };
  const serializedArticleSchema = JSON.stringify(articleSchema).replace(/</g, "\\u003c");

  return (
    <main>
      <article className="shell guide-article" aria-labelledby="guide-title">
        <Link href="/guides" className="back-link"><ArrowLeft size={16} aria-hidden="true" /> 가이드 목록</Link>
        <header>
          <p className="eyebrow">{guide.category} · FIELD NOTE</p>
          <h1 id="guide-title">{guide.title}</h1>
          <p>{guide.summary}</p>
          <dl className="guide-meta">
            <div><dt>작성</dt><dd>연구소 운영자</dd></div>
            <div><dt>발행</dt><dd><time dateTime={guide.publishedAt}>{guide.publishedAt}</time></dd></div>
            <div><dt>최근 검토</dt><dd><time dateTime={guide.reviewedAt}>{guide.reviewedAt}</time></dd></div>
            <div><dt>검토 범위</dt><dd>공식 출처·계산 가정</dd></div>
          </dl>
          <p className="review-scope">외부 금융·세무 전문가의 개별 감수가 아닌 운영자의 자료 검토입니다. 규정이 관련된 결정은 최신 원문을 다시 확인하세요.</p>
        </header>

        <div className="article-body">
          {guide.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.checklist ? <ul>{section.checklist.map((item) => <li key={item}>{item}</li>)}</ul> : null}
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

          <blockquote>좋은 계산은 미래를 맞히는 계산이 아니라, 어떤 가정을 사용했는지 다시 확인할 수 있는 계산입니다.</blockquote>

          <section aria-labelledby="scope-heading">
            <h2 id="scope-heading">이 글과 계산기의 범위</h2>
            <p>이 글은 일반적인 의사결정 정리와 입력값 기반 시뮬레이션을 위한 자료입니다. 실제 세금, 계약 조건, 투자 성과, 법률 판단을 보장하거나 개인별 자문을 제공하지 않습니다. 공식 출처 링크도 개인 상황에 대한 결론을 대신하지 않습니다.</p>
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
    </main>
  );
}
