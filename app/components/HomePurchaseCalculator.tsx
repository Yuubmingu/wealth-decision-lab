"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  ChevronDown,
  Info,
  Landmark,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import {
  calculateHomePurchase,
  recommendedStressRate,
  type HomePurchaseInputs,
  type HouseholdProfile,
  type HouseType,
  type PolicyLoan,
  type RegionType,
  type TaxMode,
} from "../lib/home-purchase";

const won = (value: number) => `${Math.round(value).toLocaleString("ko-KR")}원`;
const compactMoney = (value: number) => {
  const absolute = Math.abs(value);
  if (absolute >= 100_000_000) {
    const amount = absolute / 100_000_000;
    return `${amount.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}억원`;
  }
  return `${Math.round(absolute / 10_000).toLocaleString("ko-KR")}만원`;
};

function MoneyField({ label, value, onChange, hint }: { label: string; value: number; onChange: (value: number) => void; hint?: string }) {
  return <label className="field"><span className="field-label">{label}</span><span className="input-wrap"><input inputMode="numeric" value={Math.round(value).toLocaleString("ko-KR")} onChange={(event) => onChange(Number(event.target.value.replace(/[^0-9]/g, "")) || 0)} /><span>원</span></span>{hint && <small>{hint}</small>}</label>;
}

function NumberField({ label, value, onChange, unit, hint, step = 1 }: { label: string; value: number; onChange: (value: number) => void; unit: string; hint?: string; step?: number }) {
  return <label className="field"><span className="field-label">{label}</span><span className="input-wrap"><input inputMode={step < 1 ? "decimal" : "numeric"} step={step} value={value} onChange={(event) => onChange(Math.max(Number(event.target.value) || 0, 0))} /><span>{unit}</span></span>{hint && <small>{hint}</small>}</label>;
}

function SelectField({ label, value, onChange, children, hint }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode; hint?: string }) {
  return <label className="field"><span className="field-label">{label}</span><span className="select-wrap"><select value={value} onChange={(event) => onChange(event.target.value)}>{children}</select><ChevronDown size={15} /></span>{hint && <small>{hint}</small>}</label>;
}

function ToggleField({ label, checked, onChange, description }: { label: string; checked: boolean; onChange: (checked: boolean) => void; description: string }) {
  return <label className="toggle-field"><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><i aria-hidden="true" /></label>;
}

const defaults: HomePurchaseInputs = {
  purchasePrice: 900_000_000,
  appraisalValue: 880_000_000,
  areaM2: 84,
  houseType: "apartment",
  region: "capital-non-regulated",
  currentHouseCount: 0,
  disposeExisting: false,
  firstHome: true,
  policyLoan: "none",
  householdProfile: "newlywed",
  annualIncome: 80_000_000,
  netAssets: 350_000_000,
  existingAnnualDebtService: 8_400_000,
  existingAnnualInterest: 3_000_000,
  availableCash: 300_000_000,
  paidDeposit: 50_000_000,
  companyLoanAmount: 50_000_000,
  companyLoanRate: 2,
  companyLoanYears: 10,
  companyLoanInDsr: true,
  mortgageRate: 4.2,
  mortgageYears: 30,
  dsrLimit: 40,
  stressRate: 3,
  roomDeduction: 0,
  seniorClaims: 0,
  taxMode: "auto",
  acquisitionTaxReduction: 0,
  legalFee: 1_500_000,
  bondDiscount: 1_000_000,
  movingReserve: 3_000_000,
};

export function HomePurchaseCalculator() {
  const [input, setInput] = useState(defaults);
  const result = useMemo(() => calculateHomePurchase(input), [input]);
  const update = <K extends keyof HomePurchaseInputs>(key: K, value: HomePurchaseInputs[K]) => setInput((current) => ({ ...current, [key]: value }));
  const updateRegion = (region: RegionType) => setInput((current) => ({ ...current, region, stressRate: recommendedStressRate(region) }));
  const diagnosisTone = result.policy.status === "ineligible" ? "check" : "pass";

  return <div className="home-purchase-calculator">
    <div className="policy-snapshot"><div><Landmark size={18} /><p><strong>정책 기준일 2026. 07. 16.</strong><span>현행 핵심 규제를 반영했으며 변경 가능한 값은 직접 조정할 수 있습니다.</span></p></div><span className="snapshot-badge">POLICY SNAPSHOT</span></div>

    <div className="calculator-grid property-calculator-grid">
      <section className="input-panel">
        <div className="panel-heading"><div><span>STEP 01 · HOME & POLICY</span><h2>구매 조건을 입력해 주세요</h2></div><Building2 size={22} /></div>
        <div className="privacy-note"><LockKeyhole size={15} /><span><b>브라우저 안에서만 계산합니다.</b> 소득과 자산 정보는 서버로 전송하지 않습니다.</span></div>

        <div className="property-step"><span>01</span><div><h3>주택과 지역</h3><p>매매가격과 담보평가액 중 낮은 금액을 LTV 기준으로 사용합니다.</p></div></div>
        <div className="field-grid">
          <MoneyField label="매매가격" value={input.purchasePrice} onChange={(value) => update("purchasePrice", value)} />
          <MoneyField label="담보평가 예상액" value={input.appraisalValue} onChange={(value) => update("appraisalValue", value)} hint="분양권·신규입주 아파트는 우선 분양가액 + 발코니 확장비로 입력하고, 은행 감정가가 확인되면 해당 금액으로 바꿔 주세요." />
          <NumberField label="전용면적" value={input.areaM2} onChange={(value) => update("areaM2", value)} unit="㎡" step={0.1} />
          <SelectField label="주택 유형" value={input.houseType} onChange={(value) => update("houseType", value as HouseType)}><option value="apartment">아파트</option><option value="other">연립·다세대·단독</option></SelectField>
          <SelectField label="지역 유형" value={input.region} onChange={(value) => updateRegion(value as RegionType)} hint="규제지역 지정은 계약 전 다시 확인해 주세요."><option value="seoul">서울 전 지역 · 규제</option><option value="gyeonggi-regulated">경기 규제지역</option><option value="capital-non-regulated">경기·인천 비규제지역</option><option value="local-regulated">지방 규제지역</option><option value="local-non-regulated">지방 비규제지역</option></SelectField>
          <SelectField label="현재 주택 수" value={String(input.currentHouseCount)} onChange={(value) => update("currentHouseCount", Number(value) as 0 | 1 | 2)}><option value="0">무주택</option><option value="1">1주택</option><option value="2">2주택 이상</option></SelectField>
        </div>
        <details className="region-guide"><summary>2026년 7월 기준 규제지역 확인 <ChevronDown size={14} /></summary><div><p><b>서울</b> 25개 자치구 전체</p><p><b>경기</b> 과천, 광명, 구리, 수원 영통·장안·팔달, 성남 분당·수정·중원, 안양 동안, 용인 수지·기흥, 의왕, 하남, 화성 동탄구</p><p>행정구역 개편과 정책 변경이 있을 수 있으므로 계약일 기준 금융위원회·국토교통부 공고를 다시 확인해 주세요.</p></div></details>
        {input.currentHouseCount > 0 && <ToggleField label="기존 주택을 처분합니다" checked={input.disposeExisting} onChange={(value) => update("disposeExisting", value)} description="처분 조건부 대출로 검토하는 경우 선택해 주세요." />}

        <div className="property-step"><span>02</span><div><h3>가구와 정책대출</h3><p>선택한 상품의 주택가격·소득·순자산 기준을 자동 진단합니다.</p></div></div>
        <div className="field-grid">
          <SelectField label="대출 유형" value={input.policyLoan} onChange={(value) => update("policyLoan", value as PolicyLoan)}><option value="none">일반 금융권 주담대</option><option value="didimdol">디딤돌대출</option><option value="bogeumjari">보금자리론</option></SelectField>
          <SelectField label="가구 유형" value={input.householdProfile} onChange={(value) => update("householdProfile", value as HouseholdProfile)}><option value="general">일반가구</option><option value="newlywed">신혼가구</option><option value="one-child">1자녀 가구</option><option value="two-plus-children">2자녀 이상 가구</option></SelectField>
          <MoneyField label="부부합산 연소득" value={input.annualIncome} onChange={(value) => update("annualIncome", value)} />
          <MoneyField label="부부합산 순자산" value={input.netAssets} onChange={(value) => update("netAssets", value)} hint="디딤돌대출 자격 진단에 사용합니다." />
        </div>
        <ToggleField label="생애최초 주택구입자입니다" checked={input.firstHome} onChange={(value) => update("firstHome", value)} description="본인과 배우자 모두 과거 주택 소유 이력이 없는 경우 선택해 주세요." />

        <div className="property-step"><span>03</span><div><h3>보유 현금과 회사대출</h3><p>이미 낸 계약금과 잔금일에 사용할 수 있는 현금을 구분합니다.</p></div></div>
        <div className="field-grid">
          <MoneyField label="잔금일 사용 가능 현금" value={input.availableCash} onChange={(value) => update("availableCash", value)} />
          <MoneyField label="이미 낸 계약금" value={input.paidDeposit} onChange={(value) => update("paidDeposit", value)} />
          <MoneyField label="회사대출 가능액" value={input.companyLoanAmount} onChange={(value) => update("companyLoanAmount", value)} />
          <NumberField label="회사대출 금리" value={input.companyLoanRate} onChange={(value) => update("companyLoanRate", value)} unit="%" step={0.1} />
          <NumberField label="회사대출 상환기간" value={input.companyLoanYears} onChange={(value) => update("companyLoanYears", value)} unit="년" />
        </div>
        <ToggleField label="회사대출을 DSR에 반영합니다" checked={input.companyLoanInDsr} onChange={(value) => update("companyLoanInDsr", value)} description="금융기관 연계대출이거나 신용정보에 반영되는 경우 선택해 주세요." />

        <div className="property-step"><span>04</span><div><h3>상환능력과 담보 공제</h3><p>DSR은 원리금, DTI는 기존 부채의 이자를 구분해 계산합니다.</p></div></div>
        <div className="field-grid">
          <MoneyField label="기존 대출 연간 원리금" value={input.existingAnnualDebtService} onChange={(value) => update("existingAnnualDebtService", value)} />
          <MoneyField label="기존 대출 연간 이자" value={input.existingAnnualInterest} onChange={(value) => update("existingAnnualInterest", value)} />
          <NumberField label="주담대 예상금리" value={input.mortgageRate} onChange={(value) => update("mortgageRate", value)} unit="%" step={0.1} />
          <SelectField label="희망 상환기간" value={String(input.mortgageYears)} onChange={(value) => update("mortgageYears", Number(value))}><option value="10">10년</option><option value="15">15년</option><option value="20">20년</option><option value="30">30년</option><option value="40">40년</option><option value="50">50년</option></SelectField>
          <NumberField label="스트레스 금리" value={input.stressRate} onChange={(value) => update("stressRate", value)} unit="%p" step={0.1} hint="실제 납부금리가 아닌 DSR 심사용 가산값입니다." />
          <MoneyField label="방공제 예상액" value={input.roomDeduction} onChange={(value) => update("roomDeduction", value)} />
          <MoneyField label="선순위채권·임차보증금" value={input.seniorClaims} onChange={(value) => update("seniorClaims", value)} />
        </div>
        <label className="range-field"><span>DSR 한도 직접 조정 <strong>{input.dsrLimit}%</strong></span><input type="range" min="20" max="50" step="1" value={input.dsrLimit} onChange={(event) => update("dsrLimit", Number(event.target.value))} /></label>

        <div className="property-step"><span>05</span><div><h3>세금과 부대비용</h3><p>자동 추정치를 쓰거나 취득세율 유형을 직접 지정할 수 있습니다.</p></div></div>
        <div className="field-grid">
          <SelectField label="취득세 계산 유형" value={input.taxMode} onChange={(value) => update("taxMode", value as TaxMode)}><option value="auto">주택 수·지역으로 자동 추정</option><option value="standard">1주택 일반세율 1~3%</option><option value="eight">중과세율 8%</option><option value="twelve">중과세율 12%</option></SelectField>
          <MoneyField label="취득세 감면 예상액" value={input.acquisitionTaxReduction} onChange={(value) => update("acquisitionTaxReduction", value)} />
          <MoneyField label="등기·법무비용 예상" value={input.legalFee} onChange={(value) => update("legalFee", value)} />
          <MoneyField label="국민주택채권 할인비용" value={input.bondDiscount} onChange={(value) => update("bondDiscount", value)} />
          <MoneyField label="이사·수리 예비비" value={input.movingReserve} onChange={(value) => update("movingReserve", value)} />
        </div>
      </section>

      <section className="result-panel" aria-live="polite">
        <div className="panel-heading"><div><span>STEP 02 · FUNDING PLAN</span><h2>내 집 마련 자금 명세서</h2></div><Landmark size={22} /></div>
        <div className="verdict-line"><span>잔금일에 추가로 필요한 현금</span><strong className="verdict">{compactMoney(result.closingCashNeeded)}</strong><p>이미 낸 계약금을 제외하고 매매 잔금과 구입 부대비용을 합산했습니다.</p></div>
        <div className="kpi-grid">
          <div className="kpi kpi-green"><span>최대 주택담보대출</span><strong>{compactMoney(result.finalMortgage)}</strong><small>{result.bindingLimit.label}이 최종 한도를 결정했습니다.</small></div>
          <div className="kpi"><span>주담대 월 상환액</span><strong>{won(result.mortgageMonthlyPayment)}</strong><small>{result.effectiveYears}년 원리금균등 · 실제금리 {input.mortgageRate}%</small></div>
          <div className={`kpi ${result.cashGap > 0 ? "kpi-rust" : "kpi-green"}`}><span>보유현금 대비</span><strong>{result.cashGap > 0 ? `${compactMoney(result.cashGap)} 부족` : `${compactMoney(result.cashGap)} 여유`}</strong><small>잔금일 사용 가능 현금과 비교</small></div>
        </div>

        <div className={`policy-diagnosis ${diagnosisTone}`}>
          {result.policy.status === "ineligible" ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}
          <div><strong>{result.policy.title} 진단 · {result.policy.status === "ineligible" ? "현재 입력으로 대상 아님" : result.policy.status === "check" ? "기본요건 범위 · 추가 확인 필요" : "일반 한도 계산"}</strong>
            {result.policy.reasons.map((reason) => <p key={reason}>- {reason}</p>)}
            {result.policy.confirmations.map((item) => <p key={item}>- {item}</p>)}
          </div>
        </div>

        <div className="limit-stack"><div className="chart-heading"><h3>대출한도 병목</h3><span>적용 대상 중 가장 낮은 금액이 최종 한도입니다.</span></div>{result.limits.map((limit) => {
          const finite = Number.isFinite(limit.value);
          const finiteLimits = result.limits.filter((item) => Number.isFinite(item.value) && item.value > 0);
          const maximum = Math.max(...finiteLimits.map((item) => item.value), 1);
          const active = limit.key === result.bindingLimit.key;
          return <div className={`limit-row ${active ? "active" : ""} ${!limit.binding ? "reference" : ""}`} key={limit.key}><div><span>{limit.label}{!limit.binding ? " · 참고값" : ""}</span><strong>{finite ? compactMoney(limit.value) : "별도 한도 없음"}</strong></div><div className="limit-track"><i style={{ width: `${finite ? Math.max(limit.value / maximum * 100, 2) : 100}%` }} /></div>{active && <b>최종 병목</b>}{!limit.binding && <em>정책대출은 DSR 한도 산정에서 제외</em>}</div>;
        })}</div>

        <div className="funding-summary"><div><WalletCards size={17} /><span>총 자기자금</span><strong>{compactMoney(result.totalEquityNeeded)}</strong><small>계약금 포함 · 부대비용 포함</small></div><div><CalendarClock size={17} /><span>월 전체 부채상환</span><strong>{won(result.totalMonthlyDebt)}</strong><small>기존대출 + 주담대 + 회사대출</small></div><div><ReceiptText size={17} /><span>예상 실제 DSR</span><strong>{result.actualDsr.toFixed(1)}%</strong><small>정책대출 여부와 무관한 현금흐름 참고값</small></div></div>

        <div className="cost-ledger"><div className="chart-heading"><h3>주택 구입비용 명세</h3><span>매매대금 외 잔금일까지 준비할 금액</span></div>
          <div><span>취득세 예상 · 세율 {result.tax.rate.toFixed(2)}%</span><strong>{won(result.tax.acquisitionTax)}</strong></div>
          <div><span>지방교육세 예상</span><strong>{won(result.tax.localEducationTax)}</strong></div>
          <div><span>농어촌특별세 예상</span><strong>{won(result.tax.ruralSpecialTax)}</strong></div>
          <div><span>중개보수 상한 예상</span><strong>{won(result.brokerFee)}</strong></div>
          <div><span>등기·법무비용 입력값</span><strong>{won(input.legalFee)}</strong></div>
          <div><span>채권할인비용 입력값</span><strong>{won(input.bondDiscount)}</strong></div>
          <div><span>이사·수리 예비비</span><strong>{won(input.movingReserve)}</strong></div>
          <div className="ledger-total"><span>총 구입 부대비용</span><strong>{compactMoney(result.totalPurchaseCosts)}</strong></div>
        </div>

        <div className="repayment-section"><div className="chart-heading"><h3>상환기간별 예시</h3><span>같은 대출원금과 금리를 적용했습니다.</span></div><div className="repayment-table"><div className="repayment-row repayment-head"><span>기간</span><span>월 상환액</span><span>총이자</span></div>{result.repaymentScenarios.map((scenario) => <div className={`repayment-row ${scenario.years === result.effectiveYears ? "selected" : ""}`} key={scenario.years}><span>{scenario.years}년</span><strong>{won(scenario.monthly)}</strong><span>{compactMoney(scenario.totalInterest)}</span></div>)}</div></div>

        <div className="balance-section"><div className="chart-heading"><h3>원금 감소 예시</h3><span>{result.effectiveYears}년 원리금균등 기준</span></div><div className="balance-grid">{result.milestones.map((milestone) => <div key={milestone.year}><span>{milestone.year}년 후</span><strong>{compactMoney(milestone.balance)}</strong><i style={{ width: `${result.finalMortgage ? milestone.balance / result.finalMortgage * 100 : 0}%` }} /></div>)}</div></div>

        <div className="interest-summary"><div><span>주담대 총이자</span><strong>{compactMoney(result.mortgageTotalInterest)}</strong></div><div><span>회사대출 총이자</span><strong>{compactMoney(result.companyTotalInterest)}</strong></div><div><span>심사 적용금리</span><strong>{(input.mortgageRate + input.stressRate).toFixed(1)}%</strong><small>실제 납부금리 아님</small></div></div>

        {result.warnings.map((warning) => <div className="warning-strip compact-warning" key={warning}><Info size={16} /><span>{warning}</span></div>)}
        <details className="formula-details"><summary>계산 순서와 공식 보기 <ChevronDown size={16} /></summary><div><p>최대 주담대는 LTV, DTI, DSR, 지역·상품 절대한도 중 실제 적용되는 가장 낮은 금액으로 계산합니다.</p><p>LTV 기준 담보가액은 매매가격과 입력한 담보평가액 중 낮은 금액이며, 방공제와 선순위채권을 차감합니다.</p><p>정책대출은 일반 DSR 규제 대신 상품별 LTV·DTI와 자격·한도를 적용했으며, 실제 심사는 공사의 업무처리기준을 따릅니다.</p><p>취득세는 입력한 주택 수·지역 조합의 일반적인 세율을 추정한 값입니다. 감면과 주택 수 예외는 지방세 담당기관에서 확인해 주세요.</p></div></details>

        <div className="official-sources"><strong>공식 기준 확인</strong><div><a href="https://www.fsc.go.kr/no010101/87222" target="_blank" rel="noreferrer">금융위원회 규제지역 대출규제</a><a href="https://www.fsc.go.kr/no010101/84824" target="_blank" rel="noreferrer">금융위원회 가계부채 관리방안</a><a href="https://www.hf.go.kr/ko/sub01/sub01_02_01.do" target="_blank" rel="noreferrer">한국주택금융공사 디딤돌대출</a><a href="https://www.hf.go.kr/ko/sub01/sub01_01_01.do" target="_blank" rel="noreferrer">한국주택금융공사 보금자리론</a></div></div>
        <aside className="disclaimer-box"><strong>계약 전 반드시 다시 확인해 주세요</strong><p>본 결과는 입력값과 공개 정책을 바탕으로 한 사전 시뮬레이션이며 금융회사의 대출 승인, 세금 또는 법률 판단을 보장하지 않습니다. 실제 계약 전 금융회사, 한국주택금융공사, 관할 지방자치단체와 전문가에게 확인해 주세요.</p></aside>
      </section>
    </div>
  </div>;
}
