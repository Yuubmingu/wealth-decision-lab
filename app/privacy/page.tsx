import { StaticPage } from "../components/StaticPage";
import { analyticsConfig } from "../config";

export default function Page() {
  const analyticsEnabled = Boolean(analyticsConfig.googleAnalyticsMeasurementId);
  const adsEnabled = Boolean(analyticsConfig.googleAdSensePublisherId);

  return <StaticPage eyebrow="POLICY · UPDATED 2026.07" title="개인정보처리방침" description="현재 사이트는 회원 계정과 서버 저장소를 사용하지 않으며 계산기에 입력한 값을 수집하지 않습니다."><h2>수집하는 개인정보</h2><p>본 사이트는 회원가입, 로그인, 서버 데이터베이스를 사용하지 않습니다. 사용자가 입력한 급여·자산·주거비는 브라우저 내부에서 계산되며 운영자에게 전송되지 않습니다.</p><h2>기기 저장 기능</h2><p>사용자가 명시적으로 ‘이 기기에 입력값 저장’을 선택한 경우에만 브라우저의 localStorage에 입력값을 저장합니다. 저장한 정보는 각 계산기의 ‘저장값 전체 삭제’ 기능으로 삭제할 수 있습니다.</p><h2>분석 및 광고</h2>{analyticsEnabled ? <p>사이트 이용 현황을 파악하기 위해 Google Analytics를 사용합니다. 계산기에 입력한 금액·급여·자산 값은 Analytics 이벤트로 전송하지 않습니다.</p> : <p>현재 분석 도구는 활성화되어 있지 않습니다.</p>}{adsEnabled ? <p>Google을 포함한 제3자 광고 사업자는 쿠키를 사용할 수 있으며, Google의 광고 설정에서 맞춤광고 관련 선택을 관리할 수 있습니다. 광고 스크립트와 실제 광고 위치는 서비스 운영 상태에 따라 변경될 수 있습니다.</p> : <p>현재 광고 스크립트는 활성화되어 있지 않습니다.</p>}<h2>문의</h2><p>개인정보 관련 문의는 문의 페이지의 안내를 이용해 주세요.</p></StaticPage>;
}
