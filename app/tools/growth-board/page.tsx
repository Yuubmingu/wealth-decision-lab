import type { Metadata } from "next";
import { GrowthLeverBoard } from "../../components/WealthOperatingTools";
import { PageIntro } from "../../components/SiteChrome";
import { createPageMetadata } from "../../seo";
export const metadata: Metadata = createPageMetadata({ title: "부의 성장 레버 실행보드", description: "소득, 저축, 투자, 부채상환과 부업소득에 입력한 가정별 장기 자산 효과를 같은 기간으로 비교합니다.", path: "/tools/growth-board" });
export default function Page() { return <main><PageIntro eyebrow="LAB 03 · COMPARE" title="부의 성장 레버 실행보드" description="소득 증가, 비용 절감, 투자금, 부채 감소와 부업소득을 같은 기간의 추정 효과로 바꿔 나란히 비교합니다. 금액이 큰 항목을 자동으로 추천하거나 실행 우선순위로 판정하지 않습니다." /><div className="shell calculator-wrap"><GrowthLeverBoard /></div></main>; }
