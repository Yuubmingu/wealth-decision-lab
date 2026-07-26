import type { Metadata } from "next";
import { StaticPage } from "../components/StaticPage";
import { createPageMetadata } from "../seo";
export const metadata: Metadata = createPageMetadata({ title: "금융정보 면책사항", description: "계산 결과의 범위와 한계, 투자·세무·법률 자문이 아니라는 점을 안내합니다.", path: "/disclaimer" });
export default function Page() { return <StaticPage eyebrow="IMPORTANT NOTICE" title="금융정보 면책사항" description="계산 결과는 미래 예측이나 투자 권유가 아니라 입력 조건에 따른 시뮬레이션입니다."><h2>보장하지 않는 사항</h2><p>본 계산 결과는 미래 수익률, 세금, 물가, 수수료, 시장 변동, 실제 소득 또는 목표 달성을 보장하지 않습니다.</p><h2>전문 자문이 아닙니다</h2><p>본 사이트는 투자, 세무, 법률, 부동산 또는 이직 결정을 대신하지 않습니다. 중요한 결정을 내리기 전에는 관련 계약과 개인 상황을 검토하고, 필요한 경우 자격을 갖춘 전문가에게 문의하시기 바랍니다.</p><h2>세후 반영률</h2><p>계산기에서 사용하는 세후 반영률은 정확한 세금을 산출하는 기능이 아니라 사용자가 직접 입력하는 단순 가정입니다.</p></StaticPage>; }
