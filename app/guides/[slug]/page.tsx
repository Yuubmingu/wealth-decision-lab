import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdPlaceholder } from "../../components/SiteChrome";
import { getGuide, guides } from "../data";

export function generateStaticParams() { return guides.map((guide) => ({ slug: guide.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const guide = getGuide(slug); return { title: guide?.title ?? "가이드", description: guide?.summary }; }

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();
  return <main><article className="shell guide-article"><Link href="/guides" className="back-link"><ArrowLeft size={16} /> 가이드 목록</Link><header><p className="eyebrow">{guide.category} · FIELD NOTE</p><h1>{guide.title}</h1><p>{guide.summary}</p></header><div className="article-body"><p className="article-status">초기 구조 초안 · 실제 운영 사례와 검증된 자료를 보강할 예정입니다.</p><h2>먼저 확인할 질문</h2><p>이 선택으로 매달 실제 투자 가능한 돈이 얼마나 바뀌는지부터 확인해야 합니다. 명목 금액이 커 보여도 생활비와 세후 금액을 반영하면 결과는 달라질 수 있습니다.</p><h2>계산할 때 사용할 원칙</h2><p>확정된 금액과 기대 금액을 분리하고, 사용자가 직접 통제할 수 있는 투자비율을 별도로 둡니다. 장기 결과는 단일 예측이 아니라 보수·기준·성장 가정으로 나눠 보는 것이 안전합니다.</p><blockquote>좋은 계산은 미래를 맞히는 계산이 아니라, 어떤 가정을 사용했는지 다시 확인할 수 있는 계산입니다.</blockquote><h2>결과를 해석하는 순서</h2><ol><li>입력한 숫자가 세전인지 세후인지 확인합니다.</li><li>일회성 금액과 매달 반복되는 금액을 구분합니다.</li><li>투자원금과 복리수익을 따로 봅니다.</li><li>수익률을 낮췄을 때도 선택이 유효한지 확인합니다.</li><li>계산에 포함되지 않은 시간, 가족, 건강 비용을 적어봅니다.</li></ol><h2>현재 계산의 한계</h2><p>이 글과 계산기는 실제 세무·법률·투자 자문을 제공하지 않습니다. 개인별 세금, 물가, 수수료, 시장 손실, 소득 중단은 단순 계산에 모두 반영되지 않습니다.</p><p className="todo-note">TODO: 운영자의 실제 경험, 익명 사례, 검증 가능한 공식 출처를 추가합니다. 확인되지 않은 통계는 게시하지 않습니다.</p></div><AdPlaceholder label="가이드 하단 광고 준비 영역" /></article></main>;
}
