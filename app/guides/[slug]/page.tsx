import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createPageMetadata, siteUrl } from "../../seo";
import { getGuide, guides } from "../data";

export function generateStaticParams() { return guides.map((guide) => ({ slug: guide.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  return createPageMetadata({
    title: guide?.title ?? "가이드",
    description: guide?.summary ?? "회사원의 재무 의사결정을 위한 숫자와 체크리스트를 정리합니다.",
    path: `/guides/${slug}`,
  });
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.summary,
    mainEntityOfPage: `${siteUrl}/guides/${guide.slug}`,
    inLanguage: "ko-KR",
    isPartOf: { "@type": "WebSite", name: "부자 회사원의 의사결정 연구소", url: siteUrl },
  };
  return <main><article className="shell guide-article"><Link href="/guides" className="back-link"><ArrowLeft size={16} /> 가이드 목록</Link><header><p className="eyebrow">{guide.category} · FIELD NOTE</p><h1>{guide.title}</h1><p>{guide.summary}</p></header><div className="article-body">{guide.sections.map((section) => <section key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.checklist ? <ul>{section.checklist.map((item) => <li key={item}>{item}</li>)}</ul> : null}</section>)}<blockquote>좋은 계산은 미래를 맞히는 계산이 아니라, 어떤 가정을 사용했는지 다시 확인할 수 있는 계산입니다.</blockquote><h2>이 계산기의 범위</h2><p>이 글은 일반적인 의사결정 정리와 입력값 기반 시뮬레이션을 위한 자료입니다. 실제 세금, 계약 조건, 투자 성과, 법률 판단을 보장하거나 개인별 자문을 제공하지 않습니다.</p><Link href={guide.calculator.href} className="related-link">{guide.calculator.label}로 숫자 비교하기</Link></div></article><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} /></main>;
}
