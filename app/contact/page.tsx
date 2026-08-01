import type { Metadata } from "next";
import { StaticPage } from "../components/StaticPage";
import { analyticsConfig } from "../config";
import { createPageMetadata } from "../seo";

export const metadata: Metadata = createPageMetadata({
  title: "문의와 오류 제보",
  description: "계산 오류, 공식 자료 변경과 사이트 개선 의견의 안전한 문의 방법 및 현재 접수 상태를 안내합니다.",
  path: "/contact",
});

function isSafePublicEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && !/[\r\n]/.test(value);
}

export default function Page() {
  const configuredEmail = analyticsConfig.contactEmail.trim();
  const email = isSafePublicEmail(configuredEmail) ? configuredEmail : "";

  return (
    <StaticPage eyebrow="CONTACT · UPDATED 2026.08.01" title="계산 오류와 개선 의견을 알려주세요" description="개인 급여나 자산 자료는 보내지 말고, 계산을 재현하는 데 필요한 조건만 익명으로 정리해 주세요.">
      <h2>현재 문의 접수 상태</h2>
      {email ? (
        <p className="status-box status-ready"><strong>이메일 문의를 받고 있습니다.</strong><br /><a href={`mailto:${email}`}>{email}</a>로 보내 주세요. 이 주소 외의 계정이나 메신저로 개인정보를 요구하지 않습니다.</p>
      ) : (
        <p className="status-box"><strong>현재 공개 이메일은 운영하지 않습니다.</strong><br />일반적인 계산 오류와 공개 가능한 개선 의견은 <a href="https://github.com/Yuubmingu/wealth-decision-lab/issues" target="_blank" rel="noopener noreferrer">공개 GitHub Issues</a>에 남길 수 있습니다. 게시물은 누구나 볼 수 있으므로 개인정보, 회사 내부 정보 또는 보안 취약점은 절대 올리지 마세요. 이 페이지에는 별도로 전송되는 문의 양식이 없습니다.</p>
      )}

      <h2>문의할 때 포함할 내용</h2>
      <ul>
        <li>사용한 계산기 또는 가이드 이름과 페이지 주소</li>
        <li>개인정보를 제거한 가상 입력 조건과 계산 시점</li>
        <li>예상한 결과, 실제로 표시된 결과와 차이가 난 항목</li>
        <li>사용한 기기·브라우저와 오류를 재현한 순서</li>
        <li>제도나 사실 오류라면 확인한 정부기관·법령 원문 링크</li>
      </ul>

      <h2>보내면 안 되는 정보</h2>
      <p>주민등록번호, 계좌·카드번호, 비밀번호, 인증번호, 급여명세서 원본, 회사 내부 문서, 주택 계약서, 정확한 자산 내역은 보내지 마세요. 화면 캡처에는 이름·이메일·주소·회사명과 브라우저 탭의 민감한 정보가 보이지 않는지 먼저 확인해야 합니다.</p>
      {!email ? <p><strong>보안 취약점은 공개 GitHub Issues에 게시하지 마세요.</strong> 현재 비공개 보안 신고 채널은 준비되어 있지 않으므로, 민감한 세부정보 없이 ‘비공개 신고 채널이 필요하다’는 요청만 남기고 공개 답변을 기다려 주세요.</p> : null}

      <h2>답변과 수정 범위</h2>
      <p>오류 제보는 계산을 재현하고 공식 자료를 확인하는 데 사용합니다. 개별 투자 종목 추천, 세금 신고 판단, 법률 해석, 대출 승인 가능성이나 개인 맞춤 재무 상담은 제공하지 않습니다. 확인된 오류는 관련 페이지의 설명이나 검토일을 갱신하며, 문의 내용이 공개 사례로 필요할 때도 별도의 동의 없이 개인 내용을 게시하지 않습니다.</p>
    </StaticPage>
  );
}
