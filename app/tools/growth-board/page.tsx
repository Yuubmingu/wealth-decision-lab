import type { Metadata } from "next";
import { GrowthLeverBoard } from "../../components/WealthOperatingTools";
import { PageIntro } from "../../components/SiteChrome";
export const metadata: Metadata = { title: "부의 성장 레버 실행보드", description: "소득, 저축률, 투자금, 수익률, 부채와 부업소득 중 목표자산에 가장 큰 영향을 주는 행동을 계산합니다." };
export default function Page() { return <main><PageIntro eyebrow="LAB 03 · EXECUTE" title="부의 성장 레버 실행보드" description="소득 증가, 저축률, 투자금, 수익률, 부채 감소와 부업소득을 같은 기간의 자산효과로 바꿉니다. 이번 분기에 가장 효과가 큰 행동 한 가지를 확인해 보세요." /><div className="shell calculator-wrap"><GrowthLeverBoard /></div></main>; }
