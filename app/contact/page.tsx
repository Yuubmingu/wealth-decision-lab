import { StaticPage } from "../components/StaticPage";
import { analyticsConfig } from "../config";

export default function Page() {
  const email = analyticsConfig.contactEmail.trim();
  return <StaticPage eyebrow="CONTACT" title="계산 오류와 개선 의견을 알려주세요" description="개인 급여나 자산 자료는 보내지 마시고, 계산을 재현하는 데 필요한 조건만 익명으로 정리해 주세요."><h2>문의할 때 포함할 내용</h2><ul><li>사용한 계산기 이름</li><li>개인정보를 제거한 입력 조건</li><li>예상한 결과와 실제로 표시된 결과</li><li>사용한 기기와 브라우저</li></ul><h2>연락 채널</h2>{email ? <p><a href={`mailto:${email}`}>{email}</a>로 보내 주세요. 주민등록번호, 계좌번호, 급여명세서 등 민감한 정보는 보내지 마세요.</p> : <p>공개 문의 이메일을 준비하고 있습니다. 이메일을 연결하기 전까지는 별도 문의 양식으로 개인정보를 수집하지 않습니다.</p>}</StaticPage>;
}
