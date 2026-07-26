import type { Metadata } from "next";
import { InvestmentCompareCalculator } from "../../components/InvestmentCompareCalculator";
import { PageIntro } from "../../components/SiteChrome";
import { createPageMetadata } from "../../seo";
export const metadata: Metadata = createPageMetadata({ title: "투자 후보 비교 연구실", description: "투자 후보를 수익, 손실, 현금흐름, 회수기간, 유동성, 세금, 공부시간, 레버리지와 투자 규칙으로 비교합니다.", path: "/calculators/investment-compare" });
export default function Page() { return <main><PageIntro eyebrow="LAB 01 · COMPARE" title="투자 후보 비교 연구실" description="주식·ETF·부동산·코인·금·부업 또는 아무것도 하지 않는 선택까지 최대 세 가지를 비교합니다. 무엇을 살지보다 이 투자가 내 상황에 맞는지를 판단해 보세요." /><div className="shell calculator-wrap"><InvestmentCompareCalculator /></div></main>; }
