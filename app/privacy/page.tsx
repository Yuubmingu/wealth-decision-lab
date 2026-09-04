import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "../components/StaticPage";
import { analyticsConfig } from "../config";
import { createPageMetadata } from "../seo";

export const metadata: Metadata = createPageMetadata({
  title: "개인정보처리방침",
  description: "계산기 입력값, 브라우저 저장, Cloudflare 접속 로그, 분석 도구와 광고의 현재 처리 상태를 안내합니다.",
  path: "/privacy",
});

function hasValidAnalyticsId(value: string) {
  return /^G-[A-Z0-9]+$/i.test(value.trim());
}

function hasValidPublisherId(value: string) {
  return /^(?:ca-)?pub-\d+$/.test(value.trim());
}

export default function Page() {
  const analyticsConfigured = hasValidAnalyticsId(analyticsConfig.googleAnalyticsMeasurementId);
  const adsConfigured = hasValidPublisherId(analyticsConfig.googleAdSensePublisherId);
  const publicEmailConfigured = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(analyticsConfig.contactEmail.trim());
  const analyticsEnabled = analyticsConfigured && publicEmailConfigured;
  const contactEmail = publicEmailConfigured ? analyticsConfig.contactEmail.trim() : "";

  return (
    <StaticPage eyebrow="POLICY · UPDATED 2026.09.05" title="개인정보처리방침" description="회원 계정과 운영자 데이터베이스 없이 제공하는 현재 서비스의 처리 범위와, 분석·광고 연결 시 적용되는 조건을 구분해 안내합니다.">
      <p className="policy-summary"><strong>핵심 요약:</strong> 계산기에 입력한 급여·자산·주거비는 현재 브라우저 안에서 계산되며 운영자 서버에 저장되지 않습니다. 다만 사이트 전송과 보안을 담당하는 Cloudflare는 접속 과정에서 IP 주소 등 통신 정보를 처리할 수 있습니다.</p>
      {adsConfigured ? <p>AdSense 사이트 연결과 검토를 위해 Google 광고 스크립트를 페이지에서 불러옵니다. 사이트가 승인되고 광고가 실제 제공되면 Google 인증 CMP의 적용 지역·동의 상태에 따라 쿠키 또는 유사 식별자와 광고 관련 정보가 처리될 수 있습니다.</p> : null}
      {!publicEmailConfigured ? <p className="status-box"><strong>개인정보 권리 요청용 비공개 연락처가 아직 설정되지 않았습니다.</strong><br />공개 GitHub Issues에는 개인정보를 올릴 수 없으므로 권리 요청 채널로 사용하지 않습니다. 전용 이메일이 설정될 때까지 이 사이트는 Google Analytics와 광고 스크립트를 불러오지 않습니다.</p> : null}

      <h2>1. 처리하는 정보와 목적</h2>
      <div className="policy-grid">
        <section>
          <h3>계산기 입력값</h3>
          <p>급여, 자산, 월세, 대출과 같은 입력값은 브라우저에서 계산합니다. 회원가입, 로그인 또는 이 값을 받는 운영자 데이터베이스를 두지 않습니다.</p>
        </section>
        <section>
          <h3>접속·보안 로그</h3>
          <p>Cloudflare가 페이지 제공, 장애 분석, 악성 트래픽 차단을 위해 IP 주소, 접속 시각, 요청 주소, 브라우저·기기 정보와 보안 이벤트를 처리할 수 있습니다.</p>
        </section>
        <section>
          <h3>문의 정보</h3>
          <p>전용 이메일이 설정된 경우 사용자가 직접 보낸 이메일 주소와 본문을 오류 확인, 답변 또는 개인정보 권리 요청 처리 목적으로 처리합니다. 이메일이 없을 때 안내하는 GitHub Issues는 공개 게시판이며, 개인정보 권리 요청이나 보안 신고에는 사용할 수 없습니다.</p>
        </section>
      </div>

      <h2>2. 브라우저 저장 기능</h2>
      <p>사용자가 각 도구에서 ‘이 기기에 입력값 저장’을 직접 선택한 경우에만 해당 브라우저의 <code>localStorage</code>에 입력값을 저장합니다. 저장한 계산기·기록장 데이터는 마지막 저장 시점부터 90일 뒤 자동 만료되며, 다른 기기와 동기화되지 않고 운영자가 원격으로 읽거나 지울 수 없습니다. 공용 기기에서는 저장 기능을 사용하지 마세요.</p>
      <p>Google Analytics 측정 ID와 개인정보 요청용 이메일이 모두 설정된 경우에는 이용통계 동의 또는 거부 선택도 같은 브라우저에 저장합니다. 이 값은 선택을 기억하기 위한 <code>granted</code> 또는 <code>denied</code> 상태일 뿐이며 계산기 입력값을 포함하지 않습니다.</p>
      <p>각 도구의 삭제 버튼을 누르거나 브라우저 설정에서 yuubmingulab.com의 사이트 데이터·로컬 저장소를 삭제하면 제거할 수 있습니다. ‘계산기 저장값 전체 삭제’는 계산기 입력값만 지우며, 투자 기록장과 이용통계 선택은 해당 도구 또는 브라우저 설정에서 별도로 지울 수 있습니다. 계산기·기록장 저장값은 90일 만료 후 다음 조회 과정에서 삭제되고, 이용통계 선택은 사용자가 분석 설정을 바꾸거나 브라우저가 사이트 데이터를 정리할 때까지 그 기기에 남을 수 있습니다.</p>

      <h2>3. 분석 및 광고의 현재 상태</h2>
      <ul className="service-status" aria-label="외부 서비스 활성화 상태">
        <li><strong>개인정보 요청 연락처:</strong> {publicEmailConfigured ? `${contactEmail} 이메일이 설정되어 있습니다.` : "비공개 전용 이메일이 설정되지 않았습니다."}</li>
        <li><strong>Google Analytics:</strong> {analyticsEnabled ? "측정 ID와 비공개 연락처가 모두 설정되어 있습니다. 각 브라우저에서 선택적 이용통계에 동의한 뒤에만 스크립트를 불러옵니다." : analyticsConfigured ? "측정 ID는 있지만 비공개 개인정보 요청 연락처가 없어 안전장치에 따라 비활성화되어 있습니다." : "현재 유효한 측정 ID가 없어 활성화되어 있지 않습니다."}</li>
        <li><strong>Google AdSense:</strong> {adsConfigured ? `게시자 ID와 사이트 연결 코드가 설정되어 있고 Google 인증 CMP를 사용합니다.${publicEmailConfigured ? "" : " 다만 비공개 연락처가 없어 운영 전 보완이 필요합니다."} 승인 전에는 광고가 표시되지 않을 수 있습니다.` : "현재 유효한 게시자 ID가 없으며 광고 스크립트도 활성화되어 있지 않습니다."}</li>
      </ul>
      {analyticsEnabled ? <p>이용자가 선택적 이용통계에 동의해 Analytics가 실행되는 경우 방문 페이지, 대략적인 지역, 기기·브라우저 정보와 사이트 내 정해진 동작을 Google이 처리할 수 있습니다. 계산기에 입력한 개별 급여·자산·금액은 분석 이벤트의 값이나 이름으로 전송하지 않습니다.</p> : null}
      {adsConfigured ? <p>AdSense 사이트 연결 코드는 소유권 확인과 사이트 검토를 위해 로드됩니다. 승인 후 광고가 실제 표시되면 Google과 광고 파트너가 광고 제공, 빈도 관리, 측정과 부정행위 방지를 위해 쿠키 또는 유사 식별자를 사용할 수 있습니다. 동의가 필요한 지역에서는 Google 인증 CMP를 통해 선택지를 제공하며, 이용자는 Google 광고 센터와 CMP에서 관련 설정을 관리할 수 있습니다.</p> : null}

      <h2>4. 외부 처리자와 국외 처리</h2>
      <div className="responsive-table" role="region" aria-label="외부 처리자와 국외 처리 내역" tabIndex={0}>
        <table>
          <thead><tr><th scope="col">서비스</th><th scope="col">목적·정보</th><th scope="col">이전 국가·시점</th><th scope="col">근거·방법</th><th scope="col">보유 기준</th></tr></thead>
          <tbody>
            <tr><th scope="row">Cloudflare, Inc.</th><td>콘텐츠 전송·보안·장애 대응을 위한 IP 주소, 요청 정보와 보안 로그</td><td>페이지 요청 시 미국을 포함한 Cloudflare의 글로벌 인프라</td><td>개인정보 보호법 제28조의8 제1항 제3호에 따른 계약 이행에 필요한 처리위탁·보관(이 방침에 공개), HTTPS 네트워크 전송</td><td>Cloudflare 계약·서비스 설정 및 보안상 필요한 기간에 따르며, 애플리케이션 코드가 별도 보존본을 만들지 않음</td></tr>
            <tr><th scope="row">Google LLC 및 관련 법인</th><td>AdSense 사이트 연결·검토, 인증 CMP, 승인 후 광고 제공·빈도 관리·측정·부정행위 방지와, 동의 후 Analytics 이용통계를 위한 IP 주소, 페이지·기기·브라우저 정보, 동의 상태 및 광고 관련 식별자</td><td>Google 스크립트가 로드되거나 이용자가 Analytics·광고 관련 처리에 동의하고 기능이 실행될 때 미국 등 Google이 운영하는 국가</td><td>관련 법령과 Google 정책에 따른 고지·동의 및 HTTPS 네트워크 전송. 맞춤광고 등 동의가 필요한 처리는 인증 CMP 선택을 따름</td><td>운영자가 Google 관리 화면에서 정한 설정과 Google 정책 및 법적 보존 의무에 따름</td></tr>
            {!publicEmailConfigured ? <tr><th scope="row">GitHub, Inc.</th><td>공개 Issues를 통한 개인정보가 없는 일반 오류·개선 의견</td><td>사용자가 외부 링크로 이동해 게시할 때 미국 등 GitHub의 인프라</td><td>GitHub를 직접 선택해 이용, HTTPS 네트워크 전송</td><td>게시물 삭제 여부와 GitHub 계정·서비스 정책에 따름</td></tr> : null}
          </tbody>
        </table>
      </div>
      <p>국외 수탁자의 구체적인 서버 위치와 하위처리자는 글로벌 네트워크 운영에 따라 달라질 수 있습니다. 운영자는 외부 서비스를 실제 활성화하기 전에 계약·관리 화면의 보존 설정을 확인하고 이 표를 갱신합니다. 국외 이전 근거는 <a href="https://www.law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&amp;lsJoLnkSeq=1029334737" target="_blank" rel="noreferrer">개인정보 보호법 제28조의8</a>에서, 사업자별 정책은 <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noreferrer">Cloudflare 개인정보처리방침</a>, <a href="https://policies.google.com/privacy?hl=ko" target="_blank" rel="noreferrer">Google 개인정보처리방침</a>{!publicEmailConfigured ? <>과 <a href="https://docs.github.com/ko/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noreferrer">GitHub 개인정보취급방침</a></> : null}에서 확인할 수 있습니다.</p>

      <h2>5. 광고·동의 운영 기준</h2>
      <p>유럽경제지역, 영국 또는 스위스 등 동의가 필요한 지역에 광고를 제공할 경우에는 Google이 요구하는 인증 CMP를 먼저 설정하고, 사용자가 선택하기 전에는 동의가 필요한 저장·맞춤광고 기능을 실행하지 않아야 합니다. Analytics용 ‘선택적 이용통계’ 창은 광고용 인증 CMP가 아니며, 이를 AdSense 동의 도구로 사용하지 않습니다.</p>
      <ul>
        <li>실제로 사용하는 Analytics 이벤트와 광고 파트너를 이 방침에 반영합니다.</li>
        <li>계산기의 개별 입력 금액, 자유 입력 메모와 저장값을 분석 이벤트로 보내지 않습니다.</li>
        <li>광고는 입력창·계산 버튼·복사 또는 저장 버튼과 시각적으로 분리합니다.</li>
        <li>AdSense 승인 후 받은 게시자 ID가 정확한 <code>ads.txt</code>만 사이트 루트에 게시합니다.</li>
        <li>맞춤광고 선택은 <a href="https://myadcenter.google.com/" target="_blank" rel="noreferrer">Google 광고 센터</a>에서 관리할 수 있도록 안내합니다.</li>
      </ul>

      <h2>6. 보유기간과 파기 절차·방법</h2>
      <p>운영자는 계산기 입력값을 수집해 보유하지 않습니다. 문의 이메일은 답변과 오류 확인 또는 권리 요청 처리가 끝나 더 필요하지 않으면 지체 없이 삭제하며, 법적 의무나 보안 사고 대응을 위해 보존해야 할 때에는 해당 정보만 분리해 필요한 기간 동안 보관합니다.</p>
      <ul>
        <li><strong>브라우저 저장값:</strong> 사용자가 도구의 삭제 기능이나 브라우저 사이트 데이터 삭제 기능으로 직접 제거할 수 있습니다. 90일이 지난 저장값은 해당 도구를 다음에 열 때 만료 여부를 확인해 삭제합니다.</li>
        <li><strong>운영자 이메일:</strong> 처리 목적과 보존 필요성을 확인한 뒤 받은편지함·휴지통에서 삭제합니다. 백업본이 있다면 복구 주기가 끝나는 과정에서 접근 불가능하게 제거합니다.</li>
        <li><strong>전자 기록:</strong> 운영자가 직접 보유한 전자파일은 복구하기 어렵도록 삭제하고, 외부 처리자가 관리하는 로그와 백업은 계약·제품 설정과 해당 사업자의 파기 절차에 따릅니다.</li>
      </ul>

      <h2>7. 정보주체의 권리와 행사 방법</h2>
      <p>이용자 또는 법정대리인은 관련 법령에 따라 개인정보의 열람, 정정·삭제, 처리정지와 동의 철회를 요청할 수 있습니다. 운영자가 보유하지 않는 계산기 입력값은 이용자가 해당 브라우저에서 직접 삭제해야 하며, Analytics 동의는 화면의 ‘분석 설정’에서 언제든 거부로 바꿀 수 있습니다.</p>
      {publicEmailConfigured ? (
        <p>권리 요청은 개인정보보호 담당 부서(<a href={`mailto:${contactEmail}`}>{contactEmail}</a>)로 보내 주세요. 운영자는 요청자의 권리를 보호하기 위해 필요한 최소한의 본인 또는 대리 권한 확인을 요청할 수 있으며, 법령상 기간 안에 처리 결과 또는 제한 사유를 안내합니다.</p>
      ) : (
        <p><strong>현재는 비공개 권리 요청 이메일이 준비되지 않았습니다.</strong> 공개 GitHub Issues에는 개인정보를 올리지 마세요. 연락처가 마련될 때까지 선택적 Analytics와 광고를 비활성화하며, 브라우저 저장값은 이용자가 직접 삭제할 수 있습니다.</p>
      )}
      <p>Google 또는 Cloudflare가 직접 보유한 정보의 열람·삭제는 해당 사업자의 개인정보 도구를 함께 이용할 수 있습니다. 요청 과정에서 주민등록번호, 계좌번호, 비밀번호나 계산기 원본 데이터를 보내지 마세요.</p>

      <h2>8. 개인정보보호 담당 부서</h2>
      <p><strong>담당 부서:</strong> 부자 회사원의 의사결정 연구소 운영·개인정보보호 담당<br /><strong>비공개 권리 요청 연락처:</strong> {publicEmailConfigured ? <a href={`mailto:${contactEmail}`}>{contactEmail}</a> : "미설정 — Analytics·광고 활성화 전 설정 필요"}<br /><strong>일반 문의 현황:</strong> <Link href="/contact">문의 페이지</Link>에서 확인</p>
      <p>공개 저장소의 Issues는 누구나 읽을 수 있으므로 개인정보 권리 요청, 신원 확인 자료 또는 보안 취약점 세부정보를 게시하지 마세요.</p>

      <h2>9. 안전성 확보 조치</h2>
      <ul>
        <li>계산을 브라우저에서 수행하고 회원 계정·입력값 수집 API·운영자 입력값 데이터베이스를 두지 않아 처리 범위를 최소화합니다.</li>
        <li>HTTPS 강제, HSTS, 클릭재킹·MIME 스니핑 방지, 권한 정책과 콘텐츠 보안 정책 점검 모드를 배포 응답 헤더에 적용합니다.</li>
        <li>선택적 외부 스크립트는 유효한 설정과 사전 동의가 있을 때만 불러오며, 이용통계를 거부하면 Google Analytics 쿠키 삭제를 시도합니다.</li>
        <li>소스 변경 시 정적 검사, 계산 테스트, 의존성 취약점 감사를 자동 실행하고 의존성·빌드 도구 업데이트를 정기적으로 검토합니다.</li>
        <li>호스팅·저장소 계정의 접근권한과 다중요소 인증은 운영자가 관리합니다. 공개 코드만으로 확인할 수 없는 계정 설정은 배포 전후에 별도로 점검해야 합니다.</li>
      </ul>

      <h2>10. 안전한 이용과 방침 변경</h2>
      <p>이 사이트는 주민등록번호, 계좌번호, 인증번호나 문서 원본을 요구하지 않습니다. 민감한 개인·회사 정보를 계산기 자유 입력란이나 문의 내용에 넣지 마세요. 자동화된 개인 신용평가나 대출·채용 결정을 수행하지 않으며, 계산 결과만으로 이용자에게 법적 효과가 생기지 않습니다.</p>
      <p>수집 항목, 외부 서비스 또는 연락 채널이 달라지면 시행 전에 이 페이지의 내용과 상단 업데이트 날짜를 바꿉니다. 중요한 변경은 가능한 범위에서 사이트 안에 별도로 알립니다.</p>
    </StaticPage>
  );
}
