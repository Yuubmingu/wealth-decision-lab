import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageIntro } from "../components/SiteChrome";
import { guides } from "./data";

export default function GuidesPage() {
  return <main><PageIntro eyebrow="FIELD NOTES · GUIDES" title="숫자를 결정으로 바꾸는 방법" description="계산 결과를 과신하지 않도록 주요 가정과 해석 방법, 놓치기 쉬운 비용을 차분하게 정리합니다." /><section className="shell guides-grid">{guides.map((guide, index) => <Link href={`/guides/${guide.slug}`} key={guide.slug} className="guide-card"><div><span>{String(index + 1).padStart(2, "0")}</span><em>{guide.category}</em></div><h2>{guide.title}</h2><p>{guide.summary}</p><ArrowRight size={19} /></Link>)}</section></main>;
}
