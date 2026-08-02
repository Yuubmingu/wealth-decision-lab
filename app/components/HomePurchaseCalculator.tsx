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
  RotateCcw,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import {
  applyQuickHomeDebtAssumption,
  calculateHomePurchase,
  isRegulated,
  permittedMortgageTerms,
  recommendedStressRate,
  type HomePurchaseInputs,
  type CostEstimateMode,
  type FirstHomeTaxReliefCategory,
  type HouseholdProfile,
  type HouseType,
  type MortgageRateType,
  type PolicyLoan,
  type RegionType,
  type TaxMode,
} from "../lib/home-purchase";
import { EditableNumberInput } from "./EditableNumberInput";
import { InputModeSwitch, QuickAssumptionNote, QuickEstimateNotice, type InputMode } from "./InputModeSwitch";

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
  return <label className="field"><span className="field-label">{label}</span><span className="input-wrap"><EditableNumberInput value={value} onValueChange={onChange} min={0} decimalPlaces={0} format="money" aria-label={label} /><span>원</span></span>{hint && <small>{hint}</small>}</label>;
}

function NumberField({ label, value, onChange, unit, hint, step = 1 }: { label: string; value: number; onChange: (value: number) => void; unit: string; hint?: string; step?: number }) {
  const decimalPlaces = step < 1 ? 2 : 0;
  return <label className="field"><span className="field-label">{label}</span><span className="input-wrap"><EditableNumberInput value={value} onValueChange={onChange} min={0} decimalPlaces={decimalPlaces} aria-label={label} /><span>{unit}</span></span>{hint && <small>{hint}</small>}</label>;
}

function SelectField({ label, value, onChange, children, hint }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode; hint?: string }) {
  return <label className="field"><span className="field-label">{label}</span><span className="select-wrap"><select value={value} onChange={(event) => onChange(event.target.value)}>{children}</select><ChevronDown size={15} /></span>{hint && <small>{hint}</small>}</label>;
}

function ToggleField({ label, checked, onChange, description }: { label: string; checked: boolean; onChange: (checked: boolean) => void; description: string }) {
  return <label className="toggle-field"><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><i aria-hidden="true" /></label>;
}

const defaults: HomePurchaseInputs = {
  purchasePrice: 900_000_000,
  appraisalValue: 900_000_000,
  marketPrice: 900_000_000,
  areaM2: 84,
  houseType: "apartment",
  region: "capital-non-regulated",
  isRuralTown: false,
  currentHouseCount: 0,
  disposeExisting: false,
  firstHome: true,
  willOccupyHome: true,
  firstHomeTaxReliefCategory: "standard",
  policyLoan: "none",
  householdProfile: "newlywed",
  applicantAge: 35,
  singleHousehold: false,
  bogeumjariActualUser: false,
  annualIncome: 80_000_000,
  netAssets: 350_000_000,
  existingAnnualDebtService: 0,
  existingAnnualInterest: 0,
  availableCash: 300_000_000,
  paidDeposit: 50_000_000,
  companyLoanAmount: 0,
  companyLoanRate: 2,
  companyLoanYears: 10,
  companyLoanInDsr: true,
  mortgageRate: 4.2,
  mortgageRateType: "variable",
  mortgageYears: 30,
  dsrLimit: 40,
  stressRate: 3,
  roomDeduction: 0,
  seniorClaims: 0,
  taxMode: "auto",
  acquisitionTaxReduction: 0,
  costEstimateMode: "auto",
  legalFee: 1_500_000,
  bondDiscount: 1_000_000,
  movingReserve: 3_000_000,
  extraClosingCosts: 0,
};

export function HomePurchaseCalculator() {
  const [input, setInput] = useState(defaults);
  const [inputMode, setInputMode] = useState<InputMode>("quick");
  const calculationInput = useMemo(
    () => inputMode === "quick" ? applyQuickHomeDebtAssumption(input) : input,
    [input, inputMode],
  );
  const result = useMemo(() => calculateHomePurchase(calculationInput), [calculationInput]);
  const update = <K extends keyof HomePurchaseInputs>(key: K, value: HomePurchaseInputs[K]) => setInput((current) => ({ ...current, [key]: value }));
  const updateRegion = (region: RegionType) => setInput((current) => {
    const terms = permittedMortgageTerms(current.policyLoan, region);
    return {
      ...current,
      region,
      isRuralTown: region.startsWith("local") ? current.isRuralTown : false,
      stressRate: recommendedStressRate(region),
      mortgageYears: terms.includes(current.mortgageYears) ? current.mortgageYears : terms[terms.length - 1],
    };
  });
  const updatePolicyLoan = (policyLoan: PolicyLoan) => setInput((current) => {
    const terms = permittedMortgageTerms(policyLoan, current.region);
    return {
      ...current,
      policyLoan,
      mortgageYears: terms.includes(current.mortgageYears) ? current.mortgageYears : terms[terms.length - 1],
    };
  });
  const mortgageTerms = permittedMortgageTerms(input.policyLoan, input.region);
  const diagnosisTone = result.policy.status === "ineligible" ? "check" : "pass";
  const updatePurchasePrice = (value: number) => setInput((current) => inputMode === "quick"
    ? { ...current, purchasePrice: value, appraisalValue: value, marketPrice: value }
    : { ...current, purchasePrice: value });
  const updateHouseCount = (value: number) => setInput((current) => ({
    ...current,
    currentHouseCount: value as 0 | 1 | 2,
    firstHome: value === 0 ? current.firstHome : false,
    disposeExisting: value > 0 ? current.disposeExisting : false,
  }));

  return <div className="home-purchase-calculator">
    <div className="policy-snapshot"><div><Landmark size={18} /><p><strong>정책 기준일 2026. 08. 01.</strong><span>공개 기준을 단순화한 사전 추정이며 실제 승인·세액을 확정하지 않습니다.</span></p></div><span className="snapshot-badge">POLICY SNAPSHOT</span></div>

    <div className="calculator-grid property-calculator-grid">
      <section className="input-panel">
        <div className="panel-heading"><div><span>STEP 01 · HOME & POLICY</span><h2>구매 조건을 입력해 주세요</h2></div><Building2 size={22} /></div>
        <div className="privacy-note"><LockKeyhole size={15} /><span><b>브라우저 안에서만 계산합니다.</b> 소득과 자산 정보는 서버로 전송하지 않습니다.</span></div>
        <InputModeSwitch mode={inputMode} onChange={setInputMode} quickDescription="매매가·지역·소득·현금·금리만 입력하면 세금과 부대비용까지 자동으로 대략 계산합니다." />

        <div className="property-step"><span>01</span><div><h3>주택과 지역</h3><p>매매가격과 담보평가액 중 낮은 금액을 LTV 기준으로 사용합니다.</p></div></div>
        <div className="field-grid">
          <MoneyField label="매매가격" value={input.purchasePrice} onChange={updatePurchasePrice} />
          {inputMode === "detailed" && <><MoneyField label="담보평가 예상액" value={input.appraisalValue} onChange={(value) => update("appraisalValue", value)} hint="분양권·신규입주 아파트는 우선 분양가액 + 발코니 확장비로 입력하고, 은행 감정가가 확인되면 해당 금액으로 바꿔 주세요." />
          <MoneyField label="시세 예상액" value={input.marketPrice} onChange={(value) => update("marketPrice", value)} hint="보금자리론은 매매가·평가액뿐 아니라 공사가 인정하는 시세도 가격요건 판정에 사용합니다." />
          <NumberField label="전용면적" value={input.areaM2} onChange={(value) => update("areaM2", value)} unit="㎡" step={0.1} />
          <SelectField label="주택 유형" value={input.houseType} onChange={(value) => update("houseType", value as HouseType)}><option value="apartment">아파트</option><option value="other">연립·다세대·단독</option></SelectField></>}
          <SelectField label="지역 유형" value={input.region} onChange={(value) => updateRegion(value as RegionType)} hint="규제지역 지정은 계약 전 다시 확인해 주세요."><option value="seoul">서울 전 지역 · 규제</option><option value="gyeonggi-regulated">경기 규제지역</option><option value="capital-non-regulated">경기·인천 비규제지역</option><option value="local-regulated">지방 규제지역</option><option value="local-non-regulated">지방 비규제지역</option></SelectField>
          <SelectField label="현재 주택 수" value={String(input.currentHouseCount)} onChange={(value) => updateHouseCount(Number(value))}><option value="0">무주택</option><option value="1">1주택</option><option value="2">2주택 이상</option></SelectField>
        </div>
        {inputMode === "detailed" && <details className="region-guide"><summary>2026년 8월 1일 기준 규제지역 확인 <ChevronDown size={14} /></summary><div><p><b>서울</b> 25개 자치구 전체</p><p><b>경기</b> 과천, 광명, 구리, 수원 영통·장안·팔달, 성남 분당·수정·중원, 안양 동안, 용인 수지·기흥, 의왕, 하남, 화성 동탄구</p><p>행정구역 개편과 정책 변경이 있을 수 있으므로 계약일 기준 금융위원회·국토교통부 공고를 다시 확인해 주세요.</p></div></details>}
        {inputMode === "detailed" && input.region.startsWith("local") && <ToggleField label="수도권 밖 도시지역이 아닌 읍·면 주택입니다" checked={input.isRuralTown} onChange={(value) => update("isRuralTown", value)} description="디딤돌 면적 완화가 적용될 수 있는 주소인지 토지이용계획·건축물대장으로 확인한 경우만 선택해 주세요." />}
        {input.currentHouseCount > 0 && <ToggleField label="기존 주택을 처분합니다" checked={input.disposeExisting} onChange={(value) => update("disposeExisting", value)} description="일시적 2주택 취득세는 원칙적으로 신규주택 취득일부터 3년 이내 처분을 전제로 추정합니다. 상품별 처분기한도 확인해 주세요." />}

        <div className="property-step"><span>02</span><div><h3>가구와 정책대출</h3><p>선택한 상품의 주택가격·소득·순자산 기준을 자동 진단합니다.</p></div></div>
        <div className="field-grid">
          <SelectField label="대출 유형" value={input.policyLoan} onChange={(value) => updatePolicyLoan(value as PolicyLoan)}><option value="none">일반 금융권 주담대</option><option value="didimdol">디딤돌대출</option><option value="bogeumjari">보금자리론</option></SelectField>
          {inputMode === "detailed" && <><SelectField label="가구 유형" value={input.householdProfile} onChange={(value) => update("householdProfile", value as HouseholdProfile)}><option value="general">일반가구</option><option value="newlywed">신혼가구</option><option value="one-child">1자녀 가구</option><option value="two-plus-children">2자녀 이상 가구</option></SelectField>
          <NumberField label="신청인 만 나이" value={input.applicantAge} onChange={(value) => update("applicantAge", value)} unit="세" hint="디딤돌 단독세대주 및 보금자리론 40·50년 만기 진단에 사용" /></>}
          <MoneyField label="부부합산 연소득" value={input.annualIncome} onChange={(value) => update("annualIncome", value)} />
          {inputMode === "detailed" && <MoneyField label="부부합산 순자산" value={input.netAssets} onChange={(value) => update("netAssets", value)} hint="디딤돌대출 자격 진단에 사용합니다." />}
        </div>
        <ToggleField label="생애최초 주택구입자입니다" checked={input.firstHome} onChange={(value) => update("firstHome", value)} description="본인과 배우자 모두 과거 주택 소유 이력이 없는 경우 선택해 주세요." />
        {inputMode === "detailed" && input.firstHome && <ToggleField label="본인이 거주할 목적으로 취득합니다" checked={input.willOccupyHome} onChange={(value) => update("willOccupyHome", value)} description="생애최초 취득세 감면은 본인 거주 목적과 취득 후 3년 사후요건을 전제로 합니다." />}
        {inputMode === "detailed" && input.policyLoan === "didimdol" && <ToggleField label="미혼 단독세대주입니다" checked={input.singleHousehold} onChange={(value) => update("singleHousehold", value)} description="만 30세 이상 미혼 단독세대주는 주택가격·면적·한도가 별도로 적용됩니다." />}
        {inputMode === "detailed" && input.policyLoan === "bogeumjari" && isRegulated(input.region) && !input.firstHome && <ToggleField label="보금자리론 실수요자 요건을 충족합니다" checked={input.bogeumjariActualUser} onChange={(value) => update("bogeumjariActualUser", value)} description="공사가 정한 실수요자 요건을 확인한 경우만 선택해 주세요. 미선택 시 규제지역 LTV·DTI를 10%p 낮춰 추정합니다." />}

        <div className="property-step"><span>03</span><div><h3>보유 현금과 회사대출</h3><p>이미 낸 계약금과 잔금일에 사용할 수 있는 현금을 구분합니다.</p></div></div>
        <div className="field-grid">
          <MoneyField label="잔금일 사용 가능 현금" value={input.availableCash} onChange={(value) => update("availableCash", value)} />
          <MoneyField label="이미 낸 계약금" value={input.paidDeposit} onChange={(value) => update("paidDeposit", value)} />
          {inputMode === "detailed" && <><MoneyField label="회사대출 가능액" value={input.companyLoanAmount} onChange={(value) => update("companyLoanAmount", value)} />
          <NumberField label="회사대출 금리" value={input.companyLoanRate} onChange={(value) => update("companyLoanRate", value)} unit="%" step={0.01} hint="소수점 둘째 자리까지 입력" />
          <NumberField label="회사대출 상환기간" value={input.companyLoanYears} onChange={(value) => update("companyLoanYears", value)} unit="년" /></>}
        </div>
        {inputMode === "detailed" && <ToggleField label="회사대출을 DSR에 반영합니다" checked={input.companyLoanInDsr} onChange={(value) => update("companyLoanInDsr", value)} description="금융기관 연계대출이거나 신용정보에 반영되는 경우 선택해 주세요." />}

        <div className="property-step"><span>04</span><div><h3>상환능력과 담보 공제</h3><p>DSR은 원리금, DTI는 기존 부채의 이자를 구분해 계산합니다.</p></div></div>
        <div className="field-grid">
          {inputMode === "quick" ? <><MoneyField label="기존 대출 월 상환액" value={input.existingAnnualDebtService / 12} onChange={(value) => setInput((current) => ({
            ...current,
            existingAnnualDebtService: value * 12,
            existingAnnualInterest: value <= 0 ? 0 : Math.min(current.existingAnnualInterest, value * 12),
          }))} hint="대출이 없으면 0원" />
          {input.existingAnnualDebtService > 0 && <MoneyField label="기존 대출 월 이자" value={input.existingAnnualInterest / 12} onChange={(value) => update("existingAnnualInterest", Math.min(value * 12, input.existingAnnualDebtService))} hint="은행 앱의 최근 월 이자. 모르면 0원으로 두세요." />}</> : <><MoneyField label="기존 대출 연간 원리금" value={input.existingAnnualDebtService} onChange={(value) => update("existingAnnualDebtService", value)} />
          <MoneyField label="기존 대출 연간 이자" value={input.existingAnnualInterest} onChange={(value) => update("existingAnnualInterest", value)} /></>}
          <NumberField label="주담대 예상금리" value={input.mortgageRate} onChange={(value) => update("mortgageRate", value)} unit="%" step={0.01} hint="소수점 둘째 자리까지 입력" />
          {inputMode === "detailed" && <SelectField label="금리 유형" value={input.mortgageRateType} onChange={(value) => update("mortgageRateType", value as MortgageRateType)} hint="혼합형·주기형은 5년 이상 고정·변동주기의 보수적 대표비율입니다. 5년 미만이면 변동형을 선택하세요."><option value="variable">변동형·5년 미만 고정/주기</option><option value="mixed">혼합형 · 5년 이상 고정 후 변동</option><option value="periodic">주기형 · 5년 이상 주기</option><option value="fixed">전 기간 순수 고정형</option></SelectField>}
          <SelectField label="희망 상환기간" value={String(input.mortgageYears)} onChange={(value) => update("mortgageYears", Number(value))}>{mortgageTerms.map((years) => <option value={years} key={years}>{years}년</option>)}</SelectField>
          {inputMode === "detailed" && <><NumberField label="기준 스트레스 금리" value={input.stressRate} onChange={(value) => update("stressRate", value)} unit="%p" step={0.01} hint={`지역 단계·금리유형 반영 후 실제 계산 가산값 ${result.appliedStressRate.toFixed(2)}%p · 실제 납부금리 아님`} />
          <MoneyField label="방공제 예상액" value={input.roomDeduction} onChange={(value) => update("roomDeduction", value)} />
          <MoneyField label="선순위채권·임차보증금" value={input.seniorClaims} onChange={(value) => update("seniorClaims", value)} /></>}
        </div>
        {inputMode === "quick" && input.existingAnnualDebtService > 0 && input.existingAnnualInterest === 0 && <div className="estimate-note"><Info size={15} /><span><b>월 이자를 모르는 경우:</b> DTI가 실제보다 높게 나오지 않도록 월 상환액 전부를 이자로 보는 보수적인 가정을 적용합니다. 은행 앱에서 이자를 확인해 입력하면 추정이 더 정확해집니다.</span></div>}
        {inputMode === "detailed" && <label className="range-field"><span>DSR 한도 직접 조정 <strong>{input.dsrLimit}%</strong></span><input type="range" min="20" max="50" step="1" value={input.dsrLimit} onChange={(event) => update("dsrLimit", Number(event.target.value))} /></label>}

        {inputMode === "detailed" && <><div className="property-step"><span>05</span><div><h3>세금과 부대비용</h3><p>세금은 조건에 따라 계산하고, 부대비용은 계획용 자동값 또는 실제 견적을 선택할 수 있습니다.</p></div></div>
        <div className="field-grid">
          <SelectField label="취득세 계산 유형" value={input.taxMode} onChange={(value) => update("taxMode", value as TaxMode)}><option value="auto">주택 수·지역으로 자동 추정</option><option value="standard">1주택 일반세율 1~3%</option><option value="eight">중과세율 8%</option><option value="twelve">중과세율 12%</option></SelectField>
          {input.firstHome && <SelectField label="생애최초 취득세 감면 구분" value={input.firstHomeTaxReliefCategory} onChange={(value) => update("firstHomeTaxReliefCategory", value as FirstHomeTaxReliefCategory)} hint="특례는 건축물대장·소재지로 직접 확인한 경우만 선택하세요."><option value="standard">일반 주택 · 최대 200만원</option><option value="small-non-apartment">소형 비아파트 등 · 최대 300만원</option><option value="depopulation-area">인구감소지역 주택 · 최대 300만원</option></SelectField>}
          <MoneyField label="별도 확인된 취득세 감면액" value={input.acquisitionTaxReduction} onChange={(value) => update("acquisitionTaxReduction", value)} hint="생애최초 자동 감면과 더하지 않고 둘 중 큰 금액 하나만 적용하며 지방교육세도 같은 감면율이라고 가정합니다." />
          <SelectField label="부대비용 계산 방식" value={input.costEstimateMode} onChange={(value) => update("costEstimateMode", value as CostEstimateMode)} hint="자동값은 잔금 계획용 기준입니다."><option value="auto">자동 추정값 사용</option><option value="manual">실제 견적 직접 입력</option></SelectField>
          <MoneyField label="기타 계약·대출비용" value={input.extraClosingCosts} onChange={(value) => update("extraClosingCosts", value)} hint="인지·감정·보증료 등 별도 비용이 있으면 합산해 입력" />
        </div>
        {input.costEstimateMode === "auto" ? <div className="estimate-note"><Info size={15} /><span><b>자동 부대비용 기준:</b> 등기·법무비용은 매매가의 0.15%(80만~350만원), 채권 할인은 0.10%(30만~300만원), 이사·기본수리 예비비는 0.30%(200만~1,000만원)로 계획합니다. 실제 법무사 견적을 받으면 ‘직접 입력’으로 바꿔 주세요.</span></div> : <div className="field-grid manual-cost-fields"><MoneyField label="등기·법무비용 견적" value={input.legalFee} onChange={(value) => update("legalFee", value)} /><MoneyField label="국민주택채권 할인 견적" value={input.bondDiscount} onChange={(value) => update("bondDiscount", value)} hint="등기일 시가표준액·할인율 기준" /><MoneyField label="이사·수리 예비비" value={input.movingReserve} onChange={(value) => update("movingReserve", value)} /></div>}</>}
        <QuickAssumptionNote mode={inputMode}>담보평가액·시세는 매매가와 같게, 아파트 84㎡, 변동금리, DSR 40%, 세금과 법무·채권·이사비는 자동 추정합니다. 기존 대출 이자를 모르면 월 상환액 전부를 이자로 보수적으로 반영하고, 회사대출과 별도 공제액은 0원으로 둡니다.</QuickAssumptionNote>
        <button type="button" className="home-reset" onClick={() => setInput(defaults)}><RotateCcw size={14} /> 예시 입력값으로 초기화</button>
      </section>

      <section className="result-panel" aria-live="polite">
        <div className="panel-heading"><div><span>STEP 02 · FUNDING PLAN</span><h2>내 집 마련 자금 명세서</h2></div><Landmark size={22} /></div>
        <QuickEstimateNotice mode={inputMode} />
        <div className="verdict-line"><span>잔금일에 추가로 필요한 현금</span><strong className="verdict">{compactMoney(result.closingCashNeeded)}</strong><p>이미 낸 계약금을 제외하고 매매 잔금과 구입 부대비용을 합산했습니다.</p></div>
        <div className="kpi-grid">
          <div className="kpi kpi-green"><span>단순 추정 주택담보대출 한도</span><strong>{compactMoney(result.finalMortgage)}</strong><small>{result.bindingLimit.label}이 입력 조건 중 가장 낮았습니다. 승인금액이 아닙니다.</small></div>
          <div className="kpi"><span>주담대 월 상환액</span><strong>{won(result.mortgageMonthlyPayment)}</strong><small>{result.effectiveYears}년 원리금균등 · 실제금리 {input.mortgageRate.toFixed(2)}%</small></div>
          <div className={`kpi ${result.cashGap > 0 ? "kpi-rust" : "kpi-green"}`}><span>보유현금 대비</span><strong>{result.cashGap > 0 ? `${compactMoney(result.cashGap)} 부족` : `${compactMoney(result.cashGap)} 여유`}</strong><small>잔금일 사용 가능 현금과 비교</small></div>
        </div>

        <div className={`policy-diagnosis ${diagnosisTone}`}>
          {result.policy.status === "ineligible" ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}
          <div><strong>{result.policy.title} 진단 · {result.policy.status === "ineligible" ? "현재 입력으로 대상 아님" : result.policy.status === "check" ? "기본요건 범위 · 추가 확인 필요" : "일반 한도 계산"}</strong>
            {result.policy.reasons.map((reason) => <p key={reason}>- {reason}</p>)}
            {result.policy.confirmations.map((item) => <p key={item}>- {item}</p>)}
          </div>
        </div>

        <div className="limit-stack"><div className="chart-heading"><h3>추정 대출한도 병목</h3><span>입력 조건 중 가장 낮은 금액을 단순 추정 한도로 사용합니다.</span></div>{result.limits.map((limit) => {
          const finite = Number.isFinite(limit.value);
          const finiteLimits = result.limits.filter((item) => Number.isFinite(item.value) && item.value > 0);
          const maximum = Math.max(...finiteLimits.map((item) => item.value), 1);
          const active = limit.key === result.bindingLimit.key;
          return <div className={`limit-row ${active ? "active" : ""} ${!limit.binding ? "reference" : ""}`} key={limit.key}><div><span>{limit.label}{!limit.binding ? " · 참고값" : ""}</span><strong>{finite ? compactMoney(limit.value) : "별도 한도 없음"}</strong></div><div className="limit-track"><i style={{ width: `${finite ? Math.max(limit.value / maximum * 100, 2) : 100}%` }} /></div>{active && <b>추정 병목</b>}{!limit.binding && <em>정책대출은 DSR 한도 산정에서 제외</em>}</div>;
        })}</div>

        <div className="funding-summary"><div><WalletCards size={17} /><span>총 자기자금</span><strong>{compactMoney(result.totalEquityNeeded)}</strong><small>계약금 포함 · 부대비용 포함</small></div><div><CalendarClock size={17} /><span>월 전체 부채상환</span><strong>{won(result.totalMonthlyDebt)}</strong><small>기존대출 + 주담대 + 회사대출</small></div><div><ReceiptText size={17} /><span>예상 실제 DSR</span><strong>{result.actualDsr.toFixed(2)}%</strong><small>정책대출 여부와 무관한 현금흐름 참고값</small></div></div>

        <div className="cost-ledger"><div className="chart-heading"><h3>주택 구입비용 명세</h3><span>매매대금 외 잔금일까지 준비할 금액</span></div>
          <div><span>취득세 산출세액 · 세율 {result.tax.rate.toFixed(2)}%</span><strong>{won(result.tax.grossAcquisitionTax)}</strong></div>
          {result.tax.firstHomeReduction > 0 && <div><span>생애최초 취득세 감면 추정 · 상한 {won(result.tax.firstHomeReliefCap)}</span><strong>−{won(result.tax.firstHomeReduction)}</strong></div>}
          {result.tax.manualReduction > 0 && <div><span>별도 확인된 취득세 감면 적용</span><strong>−{won(result.tax.manualReduction)}</strong></div>}
          {(result.tax.firstHomeReduction > 0 || result.tax.manualReduction > 0) && <div><span>감면 후 취득세 예상</span><strong>{won(result.tax.acquisitionTax)}</strong></div>}
          {result.tax.localEducationTaxReduction > 0 && <div><span>지방교육세 산출세액</span><strong>{won(result.tax.grossLocalEducationTax)}</strong></div>}
          {result.tax.localEducationTaxReduction > 0 && <div><span>취득세 감면 연동 지방교육세 감면</span><strong>−{won(result.tax.localEducationTaxReduction)}</strong></div>}
          <div><span>지방교육세 예상</span><strong>{won(result.tax.localEducationTax)}</strong></div>
          <div><span>농어촌특별세 예상</span><strong>{won(result.tax.ruralSpecialTax)}</strong></div>
          <div><span>중개보수 상한 예상</span><strong>{won(result.brokerFee)}</strong></div>
          <div><span>등기·법무비용 {result.closingCosts.mode === "auto" ? "자동 추정" : "직접 입력"}</span><strong>{won(result.closingCosts.legalFee)}</strong></div>
          <div><span>채권할인비용 {result.closingCosts.mode === "auto" ? "자동 추정" : "직접 입력"}</span><strong>{won(result.closingCosts.bondDiscount)}</strong></div>
          <div><span>이사·수리 예비비 {result.closingCosts.mode === "auto" ? "자동 추정" : "직접 입력"}</span><strong>{won(result.closingCosts.movingReserve)}</strong></div>
          {result.closingCosts.extraClosingCosts > 0 && <div><span>기타 계약·대출비용</span><strong>{won(result.closingCosts.extraClosingCosts)}</strong></div>}
          <div className="ledger-total"><span>총 구입 부대비용</span><strong>{compactMoney(result.totalPurchaseCosts)}</strong></div>
        </div>

        <div className="repayment-section"><div className="chart-heading"><h3>상환기간별 예시</h3><span>같은 대출원금과 금리를 적용했습니다.</span></div><div className="repayment-table"><div className="repayment-row repayment-head"><span>기간</span><span>월 상환액</span><span>총이자</span></div>{result.repaymentScenarios.map((scenario) => <div className={`repayment-row ${scenario.years === result.effectiveYears ? "selected" : ""}`} key={scenario.years}><span>{scenario.years}년</span><strong>{won(scenario.monthly)}</strong><span>{compactMoney(scenario.totalInterest)}</span></div>)}</div></div>

        <div className="balance-section"><div className="chart-heading"><h3>원금 감소 예시</h3><span>{result.effectiveYears}년 원리금균등 기준</span></div><div className="balance-grid">{result.milestones.map((milestone) => <div key={milestone.year}><span>{milestone.year}년 후</span><strong>{compactMoney(milestone.balance)}</strong><i style={{ width: `${result.finalMortgage ? milestone.balance / result.finalMortgage * 100 : 0}%` }} /></div>)}</div></div>

        <div className="interest-summary"><div><span>주담대 총이자</span><strong>{compactMoney(result.mortgageTotalInterest)}</strong></div><div><span>회사대출 총이자</span><strong>{compactMoney(result.companyTotalInterest)}</strong></div><div><span>단순 추정 심사금리</span><strong>{(input.mortgageRate + result.appliedStressRate).toFixed(2)}%</strong><small>가산 {result.appliedStressRate.toFixed(2)}%p · 실제 납부금리 아님</small></div></div>

        {result.warnings.map((warning) => <div className="warning-strip compact-warning" key={warning}><Info size={16} /><span>{warning}</span></div>)}
        <details className="formula-details"><summary>계산 순서와 공식 보기 <ChevronDown size={16} /></summary><div><p>추정 주담대 한도는 입력한 LTV, DTI, DSR, 지역·상품 절대한도 중 적용되는 가장 낮은 금액입니다. 금융회사 내부심사, 총대출액 1억원 기준 등 모든 예외를 재현하지 않습니다.</p><p>LTV 담보가액은 매매가격과 입력한 담보평가액 중 낮은 금액이며 방공제와 선순위채권을 뺍니다. 보금자리론 가격요건은 매매가·담보평가액·입력 시세 중 가장 높은 값으로 보수적으로 확인합니다.</p><p>일반대출의 스트레스 DSR 가산값은 ‘기준 스트레스 금리 × 지역 단계 적용비율 × 금리유형 대표비율’입니다. 혼합형·주기형의 정확한 비율은 고정기간 또는 금리변동주기가 전체 만기에서 차지하는 비중에 따라 달라집니다.</p><p>디딤돌은 10·15·20·30년만 계산합니다. 정책대출은 일반 DSR 대신 상품별 LTV·DTI·자격·한도를 적용했으나 실제 심사는 공사·수탁은행의 업무처리기준을 따릅니다.</p><p>생애최초 취득세 감면은 무주택·12억원 이하 등 기본 조건에서 일반 주택 최대 200만원, 법정 소형 비아파트·도시형생활주택·해당 다가구 또는 인구감소지역 주택 최대 300만원으로 추정합니다. 취득세 감면율만큼 지방교육세 감면도 연동했습니다. 3년 이내 매각·증여·임대 등 사후 추징요건은 관할 지방자치단체에 확인해 주세요.</p><p>일시적 2주택은 기존 1주택을 원칙적으로 3년 이내 처분한다는 전제로 일반세율을 적용했습니다. 국민주택채권 할인 자동값은 잔금 계획용입니다.</p></div></details>

        <div className="official-sources"><strong>2026. 08. 01. 기준 공식 출처</strong><div><a href="https://www.fsc.go.kr/no010101/87222" target="_blank" rel="noreferrer">금융위원회 규제지역 대출규제</a><a href="https://www.fsc.go.kr/no010101/85824" target="_blank" rel="noreferrer">금융위원회 스트레스 DSR 운영방향</a><a href="https://law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1025285313" target="_blank" rel="noreferrer">국가법령정보센터 생애최초 취득세 감면</a><a href="https://law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1021868417" target="_blank" rel="noreferrer">국가법령정보센터 지방교육세</a><a href="https://www.law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1032972381" target="_blank" rel="noreferrer">국가법령정보센터 일시적 2주택</a><a href="https://www.hf.go.kr/ko/sub01/sub01_02_01.do" target="_blank" rel="noreferrer">한국주택금융공사 디딤돌대출</a><a href="https://www.hf.go.kr/ko/sub01/sub01_01_01.do" target="_blank" rel="noreferrer">한국주택금융공사 보금자리론</a><a href="https://irts.molit.go.kr/com/cmn/popup/fee/rtecsFeeRtoPopup.do" target="_blank" rel="noreferrer">국토교통부 중개보수 안내</a></div></div>
        <aside className="disclaimer-box"><strong>계약 전 반드시 다시 확인해 주세요</strong><p>본 결과는 2026년 8월 1일 공개 기준과 입력값을 단순화한 사전 추정입니다. 금융회사의 대출 승인·실행액, 한국주택금융공사의 자격판정, 취득세 또는 법률 판단을 확정하거나 보장하지 않습니다. 규정 변경, 예외, 소득·부채 산정방식에 따라 결과가 달라지므로 계약 전 금융회사·공사·관할 지방자치단체에 확인해 주세요.</p></aside>
      </section>
    </div>
  </div>;
}
