import type { Metadata } from "next";
import { StaticPage } from "../components/StaticPage";
import { createPageMetadata } from "../seo";
export const metadata: Metadata = createPageMetadata({ title: "이용약관", description: "재무 계산기와 가이드의 제공 목적, 이용 범위와 이용자의 책임을 안내합니다.", path: "/terms" });
export default function Page() {
  return (
    <StaticPage eyebrow="TERMS · UPDATED 2026.08.01" title="이용약관" description="계산기, 비교·기록 도구와 가이드의 제공 목적과 이용 범위를 안내합니다.">
      <h2>서비스의 목적</h2>
      <p>본 사이트는 사용자가 입력한 가정에 따라 목표자산, 주거비, 이직 보상, 자동차, 부채, 주택 구입과 투자 선택을 계산·비교하는 정보 제공 도구입니다. 투자 기록장과 백테스트는 판단 과정을 기록하고 과거 데이터를 검증하기 위한 기능이며, 종목이나 상품을 추천하지 않습니다.</p>
      <h2>이용자의 책임</h2>
      <p>입력값과 데이터의 정확성, 가정의 적합성, 결과 활용에 대한 책임은 이용자에게 있습니다. 계산 결과와 가이드는 실제 계약조건, 대출 승인, 세금, 법률 판단 또는 투자 성과를 보장하지 않으며 전문 자문을 대신하지 않습니다.</p>
      <h2>서비스 변경</h2>
      <p>계산식 오류 수정, 기능 개선 또는 법적 요구에 따라 서비스 내용이 변경될 수 있습니다. 중요한 계산 기준이 변경되면 해당 내용을 화면에 안내합니다.</p>
      <h2>금지 행위</h2>
      <p>서비스를 공격하거나 다른 이용자의 사용을 방해하는 행위, 콘텐츠의 의미를 오인하게 만드는 방식으로 재배포하는 행위를 금지합니다.</p>
    </StaticPage>
  );
}
