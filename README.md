# 부자 회사원의 의사결정 연구소

직장인이 목표자산, 주거비, 이직, 차량, 대출, 내 집 마련과 투자 관리 결정을 같은 기준으로 검토할 수 있게 돕는 정적 웹사이트입니다. 투자상품을 추천하거나 사용자의 결정을 대신하지 않습니다.

## 핵심 기능

- 월세 절약 자산증가 계산기
- 이직 오퍼 자산가속 계산기
- 자동차 비용·기회비용 계산기
- 대출 상환 vs 투자 비교와 내 집 마련 필요현금 계산기
- 목돈투자 vs 분할매수, 포트폴리오 리밸런싱 계산기
- 주식 투자 기록장과 부의 성장 레버 실행보드
- 정량 투자 기준 백테스트: 브라우저 CSV 처리, 데이터 품질검사, 미래정보 참조 방지, CAGR·MDD·벤치마크·거래내역
- 계산 근거와 판정 규칙 공개
- 결과 요약 복사와 CSV·JSON 내보내기
- 브라우저 localStorage 기반 기록 저장
- 가이드, 개인정보처리방침, 약관, 금융정보 면책 페이지

## 기술 스택

- React 19, TypeScript, Vinext/Vite
- Recharts
- Vitest
- Cloudflare Workers 기반 Sites 정적 배포 구조

## 로컬 실행

```bash
npm install
npm run dev
```

## 테스트와 빌드

```bash
npm run test
npm run build
```

빌드 결과는 `dist/`에 생성됩니다.

## 주요 계산 공식

연수익률을 월수익률로 환산합니다.

```text
i = (1 + annualRate)^(1/12) - 1
FV = currentAssets × (1+i)^n
   + monthlyInvestment × ((1+i)^n - 1) / i
```

수익률이 0%라면 `FV = currentAssets + monthlyInvestment × n`을 사용합니다. 모든 정기 납입은 월말에 이루어진다고 가정합니다.

## 개인정보와 분석

- 서버 API와 사용자 데이터베이스를 사용하지 않습니다.
- 입력값은 브라우저 안에서 계산됩니다.
- 저장 기능은 사용자가 직접 켠 경우에만 localStorage를 사용합니다.
- Analytics ID가 비어 있을 때는 관련 스크립트를 렌더링하지 않습니다.
- AdSense 게시자 ID는 소유권 확인용 메타태그와 `ads.txt`에만 사용합니다. 광고 스크립트와 광고 단위는 아직 활성화하지 않았습니다.

## Cloudflare 배포

이 프로젝트는 정적 내보내기를 사용합니다. Cloudflare Pages에서는 다음 값을 사용하세요.

```text
Production branch: main
Build command: npm run build
Build output directory: dist/client
```

`dist`가 아니라 `dist/client`를 지정해야 루트 페이지가 정상적으로 제공됩니다.

Cloudflare Pages의 **Settings → Environment variables**에 아래 변수를 추가하세요. 값은 실제 Pages 주소 또는 연결한 맞춤 도메인으로 바꿉니다.

```text
NEXT_PUBLIC_SITE_URL=https://yuubmingulab.com
```

배포 뒤에는 `/sitemap.xml`, `/robots.txt`, 주요 계산기 페이지가 실제 도메인을 가리키는지 확인하세요.

## 현재 한계

- 세금은 실제 세액 계산이 아닌 사용자 입력 비율입니다.
- 물가, 수수료, 소득 중단, 시장 손실을 별도 모델링하지 않습니다.
- 주거 계산기에 보증금 기회비용과 이사비가 포함되지 않습니다.
- 이직 계산기에 스톡옵션 가치를 포함하지 않습니다.
- 가이드 글은 실제 운영자 경험, 익명 사례와 검증 가능한 출처를 보강해야 합니다.
- 백테스트는 사용자가 제공한 데이터에 의존하며, 상장폐지 종목 누락·수정주가 정의·거래비용에 따라 실제 결과와 달라질 수 있습니다.

## 향후 개선

- 보증금 기회비용 계산기
- 출퇴근 시간 가치 민감도 분석
- 수익률·물가 몬테카를로 시나리오
- 접근 가능한 결과 표 다운로드
- 사용자 사례 기반 계산 시나리오 확장
