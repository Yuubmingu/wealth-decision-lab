export type RegionType =
  | "seoul"
  | "gyeonggi-regulated"
  | "capital-non-regulated"
  | "local-regulated"
  | "local-non-regulated";

export type PolicyLoan = "none" | "didimdol" | "bogeumjari";
export type HouseholdProfile = "general" | "newlywed" | "one-child" | "two-plus-children";
export type HouseType = "apartment" | "other";
export type TaxMode = "auto" | "standard" | "eight" | "twelve";
export type CostEstimateMode = "auto" | "manual";

export type HomePurchaseInputs = {
  purchasePrice: number;
  appraisalValue: number;
  areaM2: number;
  houseType: HouseType;
  region: RegionType;
  currentHouseCount: 0 | 1 | 2;
  disposeExisting: boolean;
  firstHome: boolean;
  policyLoan: PolicyLoan;
  householdProfile: HouseholdProfile;
  annualIncome: number;
  netAssets: number;
  existingAnnualDebtService: number;
  existingAnnualInterest: number;
  availableCash: number;
  paidDeposit: number;
  companyLoanAmount: number;
  companyLoanRate: number;
  companyLoanYears: number;
  companyLoanInDsr: boolean;
  mortgageRate: number;
  mortgageYears: number;
  dsrLimit: number;
  stressRate: number;
  roomDeduction: number;
  seniorClaims: number;
  taxMode: TaxMode;
  acquisitionTaxReduction: number;
  costEstimateMode: CostEstimateMode;
  legalFee: number;
  bondDiscount: number;
  movingReserve: number;
  extraClosingCosts: number;
};

export type PolicyDiagnosis = {
  status: "eligible" | "check" | "ineligible";
  title: string;
  reasons: string[];
  confirmations: string[];
  productCap: number;
  ltvRate: number;
  dtiRate: number;
  dsrExcluded: boolean;
};

export function monthlyPayment(principal: number, annualRate: number, years: number) {
  if (principal <= 0 || years <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  const months = years * 12;
  if (monthlyRate === 0) return principal / months;
  return principal * monthlyRate * Math.pow(1 + monthlyRate, months) /
    (Math.pow(1 + monthlyRate, months) - 1);
}

export function loanFromAnnualPayment(annualPayment: number, annualRate: number, years: number) {
  if (annualPayment <= 0 || years <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  const months = years * 12;
  const monthly = annualPayment / 12;
  if (monthlyRate === 0) return monthly * months;
  return monthly * (Math.pow(1 + monthlyRate, months) - 1) /
    (monthlyRate * Math.pow(1 + monthlyRate, months));
}

export function remainingBalance(principal: number, annualRate: number, years: number, paidMonths: number) {
  const months = years * 12;
  if (principal <= 0 || paidMonths >= months) return 0;
  const monthly = monthlyPayment(principal, annualRate, years);
  const rate = annualRate / 100 / 12;
  if (rate === 0) return Math.max(principal - monthly * paidMonths, 0);
  return Math.max(
    principal * Math.pow(1 + rate, paidMonths) -
      monthly * ((Math.pow(1 + rate, paidMonths) - 1) / rate),
    0,
  );
}

export function standardAcquisitionTaxRate(price: number) {
  if (price <= 600_000_000) return 1;
  if (price <= 900_000_000) return price / 150_000_000 - 3;
  return 3;
}

export function acquisitionTaxRate(input: Pick<HomePurchaseInputs, "purchasePrice" | "region" | "currentHouseCount" | "taxMode">) {
  if (input.taxMode === "standard") return standardAcquisitionTaxRate(input.purchasePrice);
  if (input.taxMode === "eight") return 8;
  if (input.taxMode === "twelve") return 12;
  const regulated = isRegulated(input.region);
  if (input.currentHouseCount === 0) return standardAcquisitionTaxRate(input.purchasePrice);
  if (input.currentHouseCount === 1) return regulated ? 8 : standardAcquisitionTaxRate(input.purchasePrice);
  return regulated ? 12 : 8;
}

export function maximumBrokerFee(price: number) {
  if (price < 50_000_000) return Math.min(price * 0.006, 250_000);
  if (price < 200_000_000) return Math.min(price * 0.005, 800_000);
  if (price < 900_000_000) return price * 0.004;
  if (price < 1_200_000_000) return price * 0.005;
  if (price < 1_500_000_000) return price * 0.006;
  return price * 0.007;
}

export function isRegulated(region: RegionType) {
  return region === "seoul" || region === "gyeonggi-regulated" || region === "local-regulated";
}

export function isCapitalOrRegulated(region: RegionType) {
  return region !== "local-non-regulated";
}

export function recommendedStressRate(region: RegionType) {
  return isCapitalOrRegulated(region) ? 3 : 1.5;
}

function generalProductCap(price: number, region: RegionType) {
  if (!isCapitalOrRegulated(region)) return Number.POSITIVE_INFINITY;
  if (price <= 1_500_000_000) return 600_000_000;
  if (price <= 2_500_000_000) return 400_000_000;
  return 200_000_000;
}

function generalLtv(input: HomePurchaseInputs) {
  if (input.firstHome) return isCapitalOrRegulated(input.region) ? 70 : 80;
  if (input.currentHouseCount >= 1 && !input.disposeExisting && isCapitalOrRegulated(input.region)) return 0;
  if (input.currentHouseCount >= 1 && !input.disposeExisting) return 60;
  return isRegulated(input.region) ? 40 : 70;
}

export function diagnosePolicy(input: HomePurchaseInputs): PolicyDiagnosis {
  if (input.policyLoan === "none") {
    return {
      status: "eligible",
      title: "일반 금융권 주택담보대출",
      reasons: [],
      confirmations: ["금융회사별 내부 한도와 신용심사를 별도로 확인해야 합니다."],
      productCap: generalProductCap(input.purchasePrice, input.region),
      ltvRate: generalLtv(input),
      dtiRate: isRegulated(input.region) ? 50 : 60,
      dsrExcluded: false,
    };
  }

  const reasons: string[] = [];
  const confirmations: string[] = [];

  if (input.policyLoan === "didimdol") {
    const childProfile = input.householdProfile === "two-plus-children";
    const specialProfile = childProfile || input.householdProfile === "newlywed";
    const incomeLimit = input.householdProfile === "newlywed"
      ? 85_000_000
      : childProfile || input.firstHome ? 70_000_000 : 60_000_000;
    const housePriceLimit = specialProfile ? 600_000_000 : 500_000_000;
    const productCap = specialProfile ? 320_000_000 : input.firstHome ? 240_000_000 : 200_000_000;
    if (input.currentHouseCount > 0) reasons.push("세대원 전원이 무주택이어야 합니다.");
    if (input.annualIncome > incomeLimit) reasons.push(`부부합산 연소득 기준 ${incomeLimit / 10_000}만원을 초과합니다.`);
    if (input.purchasePrice > housePriceLimit) reasons.push(`주택가격 기준 ${housePriceLimit / 100_000_000}억원을 초과합니다.`);
    if (input.netAssets > 511_000_000) reasons.push("부부합산 순자산 기준 5억 1,100만원을 초과합니다.");
    if (input.areaM2 > 85) reasons.push("일반 지역의 전용면적 85㎡ 기준을 초과합니다.");
    confirmations.push("세대주 여부, CB점수 350점 이상, 기금대출 중복 이용 여부를 확인해야 합니다.");
    confirmations.push("수도권 밖 읍·면 지역은 면적 기준이 달라질 수 있습니다.");
    return {
      status: reasons.length ? "ineligible" : "check",
      title: "디딤돌대출",
      reasons,
      confirmations,
      productCap,
      ltvRate: input.firstHome && !isCapitalOrRegulated(input.region) ? 80 : 70,
      dtiRate: 60,
      dsrExcluded: true,
    };
  }

  const incomeLimit = input.householdProfile === "newlywed"
    ? 85_000_000
    : input.householdProfile === "one-child"
      ? 90_000_000
      : input.householdProfile === "two-plus-children" ? 100_000_000 : 70_000_000;
  if (input.purchasePrice > 600_000_000) reasons.push("주택가격 기준 6억원을 초과합니다.");
  if (input.annualIncome > incomeLimit) reasons.push(`부부합산 연소득 기준 ${incomeLimit / 10_000}만원을 초과합니다.`);
  if (input.currentHouseCount >= 2) reasons.push("담보주택을 제외하고 2주택 이상 보유한 경우 대상이 아닙니다.");
  if (input.currentHouseCount === 1 && !input.disposeExisting) reasons.push("기존 1주택 처분 조건을 확인해야 합니다.");
  confirmations.push("CB점수 271점 이상과 한국신용정보원 신용정보 요건을 확인해야 합니다.");
  if (input.mortgageYears >= 40) confirmations.push("40·50년 만기는 연령 또는 신혼가구 조건을 추가로 충족해야 합니다.");
  const productCap = input.firstHome ? 420_000_000 : input.householdProfile === "two-plus-children" ? 400_000_000 : 360_000_000;
  return {
    status: reasons.length ? "ineligible" : "check",
    title: "보금자리론",
    reasons,
    confirmations,
    productCap,
    ltvRate: input.houseType === "apartment" ? 70 : 65,
    dtiRate: isRegulated(input.region) && !input.firstHome ? 50 : 60,
    dsrExcluded: true,
  };
}

function roundToTenThousand(value: number) {
  return Math.round(value / 10_000) * 10_000;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * 법정 수수료가 아닌, 계약 전 현금계획을 위한 보수적인 기준값입니다.
 * 국민주택채권 할인액은 등기일의 시가표준액과 당일 할인율에 따라 달라지므로
 * 실제 법무사 견적을 받으면 manual 모드로 바꾸어 그대로 입력해야 합니다.
 */
export function estimateClosingCosts(input: Pick<HomePurchaseInputs, "purchasePrice" | "costEstimateMode" | "legalFee" | "bondDiscount" | "movingReserve" | "extraClosingCosts">) {
  if (input.costEstimateMode === "manual") {
    return {
      legalFee: input.legalFee,
      bondDiscount: input.bondDiscount,
      movingReserve: input.movingReserve,
      extraClosingCosts: input.extraClosingCosts,
      mode: "manual" as const,
    };
  }

  return {
    // 등기·법무 견적 전 계획값: 매매가의 0.15%, 80만~350만원 범위
    legalFee: roundToTenThousand(clamp(input.purchasePrice * 0.0015, 800_000, 3_500_000)),
    // 채권 매입·즉시매도 할인 견적 전 계획값: 매매가의 0.10%, 30만~300만원 범위
    bondDiscount: roundToTenThousand(clamp(input.purchasePrice * 0.001, 300_000, 3_000_000)),
    // 이사·기본 수리 예비비 계획값: 매매가의 0.30%, 200만~1,000만원 범위
    movingReserve: roundToTenThousand(clamp(input.purchasePrice * 0.003, 2_000_000, 10_000_000)),
    extraClosingCosts: input.extraClosingCosts,
    mode: "auto" as const,
  };
}

function estimatedFirstHomeTaxReduction(input: HomePurchaseInputs, grossAcquisitionTax: number) {
  const eligible = input.firstHome &&
    input.currentHouseCount === 0 &&
    input.purchasePrice <= 1_200_000_000 &&
    input.taxMode !== "eight" &&
    input.taxMode !== "twelve";
  return eligible ? Math.min(grossAcquisitionTax, 2_000_000) : 0;
}

function taxBreakdown(input: HomePurchaseInputs) {
  const rate = acquisitionTaxRate(input);
  const grossAcquisitionTax = input.purchasePrice * rate / 100;
  const firstHomeReduction = estimatedFirstHomeTaxReduction(input, grossAcquisitionTax);
  const totalReduction = Math.min(grossAcquisitionTax, firstHomeReduction + input.acquisitionTaxReduction);
  const acquisitionTax = Math.max(grossAcquisitionTax - totalReduction, 0);
  const surcharge = rate >= 8;
  const localEducationTax = surcharge ? input.purchasePrice * 0.004 : grossAcquisitionTax * 0.1;
  const ruralSpecialTax = surcharge
    ? input.purchasePrice * (rate >= 12 ? 0.01 : 0.006)
    : input.areaM2 > 85 ? input.purchasePrice * 0.002 : 0;
  return { rate, grossAcquisitionTax, acquisitionTax, localEducationTax, ruralSpecialTax, firstHomeReduction, manualReduction: input.acquisitionTaxReduction };
}

export function calculateHomePurchase(input: HomePurchaseInputs) {
  const policy = diagnosePolicy(input);
  const termLimitWarning = input.policyLoan === "none" && isCapitalOrRegulated(input.region) && input.mortgageYears > 30;
  const effectiveYears = termLimitWarning ? 30 : input.mortgageYears;
  const collateralBase = Math.min(input.purchasePrice, input.appraisalValue || input.purchasePrice);
  const ltvGross = collateralBase * policy.ltvRate / 100;
  const ltvCap = Math.max(ltvGross - input.roomDeduction - input.seniorClaims, 0);
  const companyAnnualPayment = input.companyLoanInDsr
    ? monthlyPayment(input.companyLoanAmount, input.companyLoanRate, input.companyLoanYears) * 12
    : 0;
  const dsrAvailableAnnual = Math.max(
    input.annualIncome * input.dsrLimit / 100 - input.existingAnnualDebtService - companyAnnualPayment,
    0,
  );
  const dsrCap = loanFromAnnualPayment(dsrAvailableAnnual, input.mortgageRate + input.stressRate, effectiveYears);
  const dtiAvailableAnnual = Math.max(
    input.annualIncome * policy.dtiRate / 100 - input.existingAnnualInterest,
    0,
  );
  const dtiCap = loanFromAnnualPayment(dtiAvailableAnnual, input.mortgageRate, effectiveYears);
  const limits = [
    { key: "ltv", label: `LTV ${policy.ltvRate}%`, value: ltvCap, binding: true },
    { key: "dsr", label: `스트레스 DSR ${input.dsrLimit}%`, value: dsrCap, binding: !policy.dsrExcluded },
    { key: "dti", label: `DTI ${policy.dtiRate}%`, value: dtiCap, binding: true },
    { key: "product", label: "지역·상품 절대한도", value: policy.status === "ineligible" ? 0 : policy.productCap, binding: true },
  ];
  const bindingLimits = limits.filter((limit) => limit.binding);
  const lowestValue = Math.min(...bindingLimits.map((limit) => limit.value));
  const finalMortgage = Math.max(lowestValue, 0);
  const bindingLimit = bindingLimits.find((limit) => limit.value === lowestValue) ?? bindingLimits[0];

  const tax = taxBreakdown(input);
  const brokerFee = maximumBrokerFee(input.purchasePrice);
  const closingCosts = estimateClosingCosts(input);
  const totalPurchaseCosts = tax.acquisitionTax + tax.localEducationTax + tax.ruralSpecialTax +
    brokerFee + closingCosts.legalFee + closingCosts.bondDiscount + closingCosts.movingReserve + closingCosts.extraClosingCosts;
  const totalEquityNeeded = Math.max(input.purchasePrice - finalMortgage - input.companyLoanAmount, 0) + totalPurchaseCosts;
  const closingCashNeeded = Math.max(
    input.purchasePrice - input.paidDeposit - finalMortgage - input.companyLoanAmount,
    0,
  ) + totalPurchaseCosts;
  const cashGap = closingCashNeeded - input.availableCash;
  const mortgageMonthlyPayment = monthlyPayment(finalMortgage, input.mortgageRate, effectiveYears);
  const companyMonthlyPayment = monthlyPayment(input.companyLoanAmount, input.companyLoanRate, input.companyLoanYears);
  const mortgageTotalInterest = Math.max(mortgageMonthlyPayment * effectiveYears * 12 - finalMortgage, 0);
  const companyTotalInterest = Math.max(companyMonthlyPayment * input.companyLoanYears * 12 - input.companyLoanAmount, 0);
  const actualDsr = input.annualIncome > 0
    ? (mortgageMonthlyPayment * 12 + input.existingAnnualDebtService + companyAnnualPayment) / input.annualIncome * 100
    : 0;

  const permittedTerms = input.policyLoan === "none" && isCapitalOrRegulated(input.region)
    ? [10, 20, 30]
    : [10, 20, 30, 40];
  const repaymentScenarios = permittedTerms.map((years) => {
    const monthly = monthlyPayment(finalMortgage, input.mortgageRate, years);
    return { years, monthly, totalInterest: Math.max(monthly * years * 12 - finalMortgage, 0) };
  });
  const milestones = [1, 5, 10, effectiveYears]
    .filter((year, index, values) => year <= effectiveYears && values.indexOf(year) === index)
    .map((year) => ({ year, balance: remainingBalance(finalMortgage, input.mortgageRate, effectiveYears, year * 12) }));

  const warnings: string[] = [];
  if (termLimitWarning) warnings.push("수도권·규제지역의 일반 주담대 만기는 30년 이내로 제한되어 30년으로 계산했습니다.");
  if (input.currentHouseCount > 0) warnings.push("일시적 2주택, 상속주택 등 주택 수 예외와 취득세 중과 배제 여부는 자동 판정하지 않습니다.");
  if (input.taxMode === "auto" && input.currentHouseCount > 0) warnings.push("다주택 취득세는 일반적인 주택 수와 규제지역 조합으로 추정했습니다. 지방세 담당기관에서 반드시 확인해 주세요.");
  if (input.firstHome && input.purchasePrice > 1_200_000_000) warnings.push("생애최초 취득세 감면은 취득 당시 가액 12억원 이하 주택에 한해 검토됩니다.");
  if (closingCosts.mode === "auto") warnings.push("등기·법무·채권·이사비는 견적 전 계획값입니다. 국민주택채권 할인액은 등기일 시가표준액과 당일 할인율에 따라 달라집니다.");
  if (input.companyLoanAmount > 0) warnings.push("회사대출이 사내기금인지 금융기관 연계대출인지에 따라 DSR과 담보대출 실행 순서가 달라질 수 있습니다.");
  if (input.roomDeduction === 0) warnings.push("방공제 또는 소액임차보증금 공제가 발생하면 LTV 한도가 더 줄어들 수 있습니다.");
  if (input.paidDeposit > input.purchasePrice) warnings.push("이미 낸 계약금이 매매가격보다 큽니다. 입력값을 다시 확인해 주세요.");
  if (input.existingAnnualInterest > input.existingAnnualDebtService) warnings.push("기존 대출의 연간 이자가 연간 원리금보다 큽니다. DTI·DSR 입력값을 다시 확인해 주세요.");

  return {
    policy,
    effectiveYears,
    termLimitWarning,
    collateralBase,
    limits,
    bindingLimit,
    finalMortgage,
    tax,
    brokerFee,
    closingCosts,
    totalPurchaseCosts,
    totalEquityNeeded,
    closingCashNeeded,
    cashGap,
    mortgageMonthlyPayment,
    companyMonthlyPayment,
    totalMonthlyDebt: mortgageMonthlyPayment + companyMonthlyPayment + input.existingAnnualDebtService / 12,
    mortgageTotalInterest,
    companyTotalInterest,
    actualDsr,
    repaymentScenarios,
    milestones,
    warnings,
  };
}
