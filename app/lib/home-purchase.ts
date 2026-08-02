export type RegionType =
  | "seoul"
  | "gyeonggi-regulated"
  | "capital-non-regulated"
  | "local-regulated"
  | "local-non-regulated";

export type PolicyLoan = "none" | "didimdol" | "bogeumjari";
export type HouseholdProfile = "general" | "newlywed" | "one-child" | "two-plus-children";
export type HouseType = "apartment" | "other";
export type MortgageRateType = "variable" | "mixed" | "periodic" | "fixed";
export type FirstHomeTaxReliefCategory = "standard" | "small-non-apartment" | "depopulation-area";
export type TaxMode = "auto" | "standard" | "eight" | "twelve";
export type CostEstimateMode = "auto" | "manual";

export type HomePurchaseInputs = {
  purchasePrice: number;
  appraisalValue: number;
  marketPrice: number;
  areaM2: number;
  houseType: HouseType;
  region: RegionType;
  isRuralTown: boolean;
  currentHouseCount: 0 | 1 | 2;
  disposeExisting: boolean;
  firstHome: boolean;
  willOccupyHome: boolean;
  firstHomeTaxReliefCategory: FirstHomeTaxReliefCategory;
  policyLoan: PolicyLoan;
  householdProfile: HouseholdProfile;
  applicantAge: number;
  singleHousehold: boolean;
  bogeumjariActualUser: boolean;
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
  mortgageRateType: MortgageRateType;
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

export function applyQuickHomeDebtAssumption(input: HomePurchaseInputs): HomePurchaseInputs {
  if (input.existingAnnualDebtService <= 0 || input.existingAnnualInterest > 0) return input;

  return {
    ...input,
    // 빠른 계산에서 이자액을 모르면 DTI를 낙관적으로 만들지 않도록
    // 기존 원리금 상환액 전부를 이자로 보는 보수적인 상한 가정을 쓴다.
    existingAnnualInterest: input.existingAnnualDebtService,
  };
}

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

export function acquisitionTaxRate(input: Pick<HomePurchaseInputs, "purchasePrice" | "region" | "currentHouseCount" | "disposeExisting" | "taxMode">) {
  if (input.taxMode === "standard") return standardAcquisitionTaxRate(input.purchasePrice);
  if (input.taxMode === "eight") return 8;
  if (input.taxMode === "twelve") return 12;
  const regulated = isRegulated(input.region);
  if (input.currentHouseCount === 0) return standardAcquisitionTaxRate(input.purchasePrice);
  // 기존 1주택을 법정기한(현재 일반적으로 신규주택 취득일부터 3년) 안에 처분하는
  // 일시적 2주택은 중과 대상에서 제외되는 것으로 계획한다. 실제 예외 충족 여부는 별도 확인 대상이다.
  if (input.currentHouseCount === 1 && input.disposeExisting) return standardAcquisitionTaxRate(input.purchasePrice);
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

/**
 * 2026-08-01 계획용 대표 반영비율.
 * 혼합형·주기형은 고정기간/금리변동주기와 전체 만기의 비율에 따라 실제 반영률이 달라진다.
 * 이 계산기는 5년 이상 고정·주기 상품의 가장 보수적인 대표 상단을 사용하고,
 * 5년 미만 상품은 UI에서 변동형으로 입력하도록 안내한다.
 */
export function stressRateTypeRatio(rateType: MortgageRateType, region: RegionType) {
  if (rateType === "fixed") return 0;
  if (rateType === "variable") return 1;
  const secondStage = region === "local-non-regulated";
  if (rateType === "mixed") return secondStage ? 0.6 : 0.8;
  return secondStage ? 0.3 : 0.4;
}

export function effectiveStressRate(input: Pick<HomePurchaseInputs, "region" | "mortgageRateType" | "stressRate">) {
  const stageRatio = input.region === "local-non-regulated" ? 0.5 : 1;
  return input.stressRate * stageRatio * stressRateTypeRatio(input.mortgageRateType, input.region);
}

export function permittedMortgageTerms(policyLoan: PolicyLoan, region: RegionType) {
  if (policyLoan === "didimdol") return [10, 15, 20, 30];
  if (policyLoan === "bogeumjari") return [10, 15, 20, 30, 40, 50];
  return isCapitalOrRegulated(region) ? [10, 15, 20, 30] : [10, 15, 20, 30, 40, 50];
}

function generalProductCap(price: number, region: RegionType) {
  if (!isCapitalOrRegulated(region)) return Number.POSITIVE_INFINITY;
  if (price <= 1_500_000_000) return 600_000_000;
  if (price <= 2_500_000_000) return 400_000_000;
  return 200_000_000;
}

function generalLtv(input: HomePurchaseInputs) {
  const verifiedFirstHome = input.firstHome && input.currentHouseCount === 0;
  if (verifiedFirstHome) return isCapitalOrRegulated(input.region) ? 70 : 80;
  const temporaryTwoHome = input.currentHouseCount === 1 && input.disposeExisting;
  if (input.currentHouseCount >= 1 && !temporaryTwoHome && isCapitalOrRegulated(input.region)) return 0;
  if (input.currentHouseCount >= 1 && !temporaryTwoHome) return 60;
  return isRegulated(input.region) ? 40 : 70;
}

export function diagnosePolicy(input: HomePurchaseInputs): PolicyDiagnosis {
  if (input.policyLoan === "none") {
    return {
      status: "check",
      title: "일반 금융권 주택담보대출",
      reasons: [],
      confirmations: ["표시 금액은 공개 규제를 단순화한 추정치입니다. 금융회사별 내부 한도, 총대출액 기준, 신용심사와 예외를 별도로 확인해야 합니다."],
      productCap: generalProductCap(input.purchasePrice, input.region),
      ltvRate: generalLtv(input),
      dtiRate: isRegulated(input.region) ? 50 : 60,
      dsrExcluded: false,
    };
  }

  const reasons: string[] = [];
  const confirmations: string[] = [];
  const verifiedFirstHome = input.firstHome && input.currentHouseCount === 0;

  if (input.applicantAge < 19) reasons.push("정책대출은 민법상 성년인 신청인을 전제로 합니다.");
  if (input.firstHome && input.currentHouseCount > 0) confirmations.push("현재 주택 수와 생애최초 입력이 서로 맞지 않아 생애최초 우대는 적용하지 않았습니다.");

  if (input.policyLoan === "didimdol") {
    const childProfile = input.householdProfile === "two-plus-children";
    const specialProfile = childProfile || input.householdProfile === "newlywed";
    const incomeLimit = input.householdProfile === "newlywed"
      ? 85_000_000
      : childProfile || verifiedFirstHome ? 70_000_000 : 60_000_000;
    const standardHousePriceLimit = specialProfile ? 600_000_000 : 500_000_000;
    const singleHouseholdPriceLimit = 300_000_000;
    const housePriceLimit = input.singleHousehold ? singleHouseholdPriceLimit : standardHousePriceLimit;
    const standardProductCap = specialProfile ? 320_000_000 : verifiedFirstHome ? 240_000_000 : 200_000_000;
    const productCap = input.singleHousehold ? verifiedFirstHome ? 200_000_000 : 150_000_000 : standardProductCap;
    const areaLimit = input.singleHousehold ? input.isRuralTown ? 70 : 60 : input.isRuralTown ? 100 : 85;
    const eligibilityValue = Math.max(input.purchasePrice, input.appraisalValue || input.purchasePrice);
    if (input.currentHouseCount > 0) reasons.push("세대원 전원이 무주택이어야 합니다.");
    if (input.annualIncome > incomeLimit) reasons.push(`부부합산 연소득 기준 ${incomeLimit / 10_000}만원을 초과합니다.`);
    if (eligibilityValue > housePriceLimit) reasons.push(`입력한 매매가·담보평가액 중 높은 금액이 주택가격 기준 ${housePriceLimit / 100_000_000}억원을 초과합니다.`);
    if (input.netAssets > 511_000_000) reasons.push("부부합산 순자산 기준 5억 1,100만원을 초과합니다.");
    if (input.areaM2 > areaLimit) reasons.push(`선택한 세대·지역의 전용면적 ${areaLimit}㎡ 기준을 초과합니다.`);
    if (input.singleHousehold && input.applicantAge < 30) reasons.push("만 30세 미만 미혼 단독세대주는 일반적인 디딤돌대출 대상에서 제외됩니다.");
    confirmations.push("세대주 여부, CB점수 350점 이상, 기금대출 중복 이용 여부를 확인해야 합니다.");
    if (input.isRuralTown) confirmations.push("전용면적 완화는 수도권 밖 도시지역이 아닌 읍·면 소재 주택인지 공부상 주소로 확인해야 합니다.");
    if (input.singleHousehold) confirmations.push("미혼 단독세대주 특례의 세대 구성, 부양가족 등 세부 예외는 수탁은행에서 확인해야 합니다.");
    return {
      status: reasons.length ? "ineligible" : "check",
      title: "디딤돌대출",
      reasons,
      confirmations,
      productCap,
      ltvRate: verifiedFirstHome && !isCapitalOrRegulated(input.region) ? 80 : 70,
      dtiRate: 60,
      dsrExcluded: true,
    };
  }

  const incomeLimit = input.householdProfile === "newlywed"
    ? 85_000_000
    : input.householdProfile === "one-child"
      ? 90_000_000
      : input.householdProfile === "two-plus-children" ? 100_000_000 : 70_000_000;
  const eligibilityValue = Math.max(
    input.purchasePrice,
    input.appraisalValue || input.purchasePrice,
    input.marketPrice || input.purchasePrice,
  );
  if (eligibilityValue > 600_000_000) reasons.push("매매가·담보평가액·입력 시세 중 하나라도 6억원을 초과합니다.");
  if (input.annualIncome > incomeLimit) reasons.push(`부부합산 연소득 기준 ${incomeLimit / 10_000}만원을 초과합니다.`);
  if (input.currentHouseCount >= 2) reasons.push("담보주택을 제외하고 2주택 이상 보유한 경우 대상이 아닙니다.");
  if (input.currentHouseCount === 1 && !input.disposeExisting) reasons.push("기존 1주택 처분 조건을 확인해야 합니다.");
  confirmations.push("CB점수 271점 이상과 한국신용정보원 신용정보 요건을 확인해야 합니다.");
  if (input.currentHouseCount === 1 && input.disposeExisting) confirmations.push("기존 주택은 보금자리론의 처분기한과 추가주택 보유 제한을 충족해야 합니다.");
  const newlywed = input.householdProfile === "newlywed";
  const eligibleForFortyYears = input.applicantAge < 40 || newlywed && input.applicantAge < 50;
  const eligibleForFiftyYears = input.applicantAge < 35 || newlywed && input.applicantAge < 40;
  if (input.mortgageYears === 40 && !eligibleForFortyYears) reasons.push("40년 만기는 신청인이 만 40세 미만이거나, 만 50세 미만 신혼가구여야 합니다.");
  if (input.mortgageYears === 50 && !eligibleForFiftyYears) reasons.push("50년 만기는 신청인이 만 35세 미만이거나, 만 40세 미만 신혼가구여야 합니다.");
  const productCap = verifiedFirstHome ? 420_000_000 : input.householdProfile === "two-plus-children" ? 400_000_000 : 360_000_000;
  const regulatedReduction = isRegulated(input.region) && !verifiedFirstHome && !input.bogeumjariActualUser;
  if (isRegulated(input.region) && input.bogeumjariActualUser) confirmations.push("규제지역 LTV·DTI 차감 예외에 필요한 실수요자 요건은 공사 심사에서 확인해야 합니다.");
  if (regulatedReduction) confirmations.push("전세사기피해자 등 규제지역 LTV·DTI 차감 예외는 입력받지 않아 보수적으로 10%p를 낮췄습니다.");
  return {
    status: reasons.length ? "ineligible" : "check",
    title: "보금자리론",
    reasons,
    confirmations,
    productCap,
    ltvRate: (input.houseType === "apartment" ? 70 : 65) - (regulatedReduction ? 10 : 0),
    dtiRate: regulatedReduction ? 50 : 60,
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

function firstHomeTaxReliefCap(input: HomePurchaseInputs) {
  if (input.firstHomeTaxReliefCategory === "depopulation-area") return 3_000_000;
  if (input.firstHomeTaxReliefCategory === "small-non-apartment") {
    const priceLimit = isCapitalOrRegulated(input.region) && input.region !== "local-regulated"
      ? 600_000_000
      : 300_000_000;
    const meetsSmallHomeConditions = input.houseType === "other" && input.areaM2 <= 60 && input.purchasePrice <= priceLimit;
    return meetsSmallHomeConditions ? 3_000_000 : 2_000_000;
  }
  return 2_000_000;
}

function estimatedFirstHomeTaxReduction(input: HomePurchaseInputs, grossAcquisitionTax: number) {
  const eligible = input.firstHome &&
    input.currentHouseCount === 0 &&
    input.applicantAge >= 19 &&
    input.willOccupyHome &&
    input.purchasePrice <= 1_200_000_000 &&
    input.taxMode !== "eight" &&
    input.taxMode !== "twelve";
  const reliefCap = firstHomeTaxReliefCap(input);
  return {
    amount: eligible ? Math.min(grossAcquisitionTax, reliefCap) : 0,
    reliefCap,
    enhancedRequested: input.firstHomeTaxReliefCategory !== "standard",
    enhancedApplied: eligible && reliefCap === 3_000_000,
  };
}

function taxBreakdown(input: HomePurchaseInputs) {
  const rate = acquisitionTaxRate(input);
  const grossAcquisitionTax = input.purchasePrice * rate / 100;
  const estimatedFirstHome = estimatedFirstHomeTaxReduction(input, grossAcquisitionTax);
  const manualReductionCandidate = Math.min(Math.max(input.acquisitionTaxReduction, 0), grossAcquisitionTax);
  // 서로 다른 감면을 단순 합산하지 않는다. 사용자가 확인한 별도 감면액과 자동 추정 중 큰 한 가지만 적용한다.
  const useManualReduction = manualReductionCandidate > estimatedFirstHome.amount;
  const firstHomeReduction = useManualReduction ? 0 : estimatedFirstHome.amount;
  const manualReduction = useManualReduction ? manualReductionCandidate : 0;
  const totalReduction = Math.max(firstHomeReduction, manualReduction);
  const acquisitionTax = Math.max(grossAcquisitionTax - totalReduction, 0);
  const surcharge = rate >= 8;
  const grossLocalEducationTax = surcharge ? input.purchasePrice * 0.004 : grossAcquisitionTax * 0.1;
  const reductionRatio = grossAcquisitionTax > 0 ? totalReduction / grossAcquisitionTax : 0;
  const localEducationTaxReduction = grossLocalEducationTax * reductionRatio;
  const localEducationTax = Math.max(grossLocalEducationTax - localEducationTaxReduction, 0);
  const ruralSpecialTax = input.areaM2 <= 85
    ? 0
    : surcharge
      ? input.purchasePrice * (rate >= 12 ? 0.01 : 0.006)
      : input.purchasePrice * 0.002;
  return {
    rate,
    grossAcquisitionTax,
    acquisitionTax,
    grossLocalEducationTax,
    localEducationTaxReduction,
    localEducationTax,
    ruralSpecialTax,
    firstHomeReduction,
    firstHomeReliefCap: estimatedFirstHome.reliefCap,
    enhancedFirstHomeReliefRequested: estimatedFirstHome.enhancedRequested,
    enhancedFirstHomeReliefApplied: estimatedFirstHome.enhancedApplied,
    manualReduction,
    ignoredManualReduction: input.acquisitionTaxReduction > 0 && !useManualReduction,
  };
}

export function calculateHomePurchase(input: HomePurchaseInputs) {
  const policy = diagnosePolicy(input);
  const permittedTerms = permittedMortgageTerms(input.policyLoan, input.region);
  const termLimitWarning = !permittedTerms.includes(input.mortgageYears);
  const permittedTermsNotLongerThanRequested = permittedTerms.filter((years) => years <= input.mortgageYears);
  const effectiveYears = termLimitWarning
    ? permittedTermsNotLongerThanRequested[permittedTermsNotLongerThanRequested.length - 1] ?? permittedTerms[0]
    : input.mortgageYears;
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
  const appliedStressRate = effectiveStressRate(input);
  const dsrCap = loanFromAnnualPayment(dsrAvailableAnnual, input.mortgageRate + appliedStressRate, effectiveYears);
  const dtiAvailableAnnual = Math.max(
    input.annualIncome * policy.dtiRate / 100 - input.existingAnnualInterest,
    0,
  );
  const dtiCap = loanFromAnnualPayment(dtiAvailableAnnual, input.mortgageRate, effectiveYears);
  const limits = [
    { key: "ltv", label: `LTV ${policy.ltvRate}%`, value: ltvCap, binding: true },
    { key: "dsr", label: `스트레스 DSR ${input.dsrLimit}% · 가산 ${appliedStressRate.toFixed(2)}%p`, value: dsrCap, binding: !policy.dsrExcluded },
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

  const repaymentScenarios = permittedTerms.map((years) => {
    const monthly = monthlyPayment(finalMortgage, input.mortgageRate, years);
    return { years, monthly, totalInterest: Math.max(monthly * years * 12 - finalMortgage, 0) };
  });
  const milestones = [1, 5, 10, effectiveYears]
    .filter((year, index, values) => year <= effectiveYears && values.indexOf(year) === index)
    .map((year) => ({ year, balance: remainingBalance(finalMortgage, input.mortgageRate, effectiveYears, year * 12) }));

  const warnings: string[] = [];
  if (termLimitWarning && input.policyLoan === "didimdol") warnings.push(`디딤돌대출 만기는 10·15·20·30년만 가능하여 ${effectiveYears}년으로 계산했습니다.`);
  else if (termLimitWarning) warnings.push(`선택한 지역·상품의 계획용 만기 범위에 맞춰 ${effectiveYears}년으로 계산했습니다.`);
  if (input.currentHouseCount === 1 && input.disposeExisting) warnings.push("일시적 2주택 일반세율은 기존 주택을 신규주택 취득일부터 원칙적으로 3년 이내 처분하는 조건으로 추정했습니다. 상속주택 등 주택 수 예외와 세부 기산일은 관할 지방자치단체에서 확인해 주세요.");
  else if (input.currentHouseCount > 0) warnings.push("상속주택 등 주택 수 예외와 취득세 중과 배제 여부는 자동 판정하지 않습니다.");
  if (input.taxMode === "auto" && input.currentHouseCount > 0) warnings.push("다주택 취득세는 일반적인 주택 수와 규제지역 조합으로 추정했습니다. 지방세 담당기관에서 반드시 확인해 주세요.");
  if (input.firstHome && input.purchasePrice > 1_200_000_000) warnings.push("생애최초 취득세 감면은 취득 당시 가액 12억원 이하 주택에 한해 검토됩니다.");
  if (input.firstHome && input.applicantAge < 19) warnings.push("미성년자는 생애최초 취득세 감면 대상에서 제외되어 자동 감면을 적용하지 않았습니다.");
  if (input.firstHome && !input.willOccupyHome) warnings.push("본인이 거주할 목적이 아닌 것으로 입력되어 생애최초 취득세 감면을 적용하지 않았습니다.");
  if (input.firstHome && input.currentHouseCount > 0) warnings.push("현재 주택 수가 1채 이상이므로 생애최초 우대와 취득세 감면을 자동 적용하지 않았습니다.");
  if (tax.enhancedFirstHomeReliefRequested && !tax.enhancedFirstHomeReliefApplied) warnings.push("선택한 생애최초 300만원 특례의 면적·주택유형·가액 요건이 입력값과 맞지 않아 일반 감면 상한 200만원으로 추정했습니다.");
  if (tax.enhancedFirstHomeReliefApplied) warnings.push("생애최초 300만원 특례는 소형 비아파트·도시형생활주택·해당 다가구 또는 인구감소지역 주택의 법정 요건을 직접 확인했다는 전제입니다.");
  if (tax.ignoredManualReduction) warnings.push("별도 취득세 감면 입력액이 자동 생애최초 감면보다 작아 중복 합산하지 않고 더 큰 자동 감면만 적용했습니다.");
  if (input.policyLoan === "none") warnings.push(`스트레스 DSR은 기준 스트레스 금리 ${input.stressRate.toFixed(2)}%p에 지역 단계와 금리유형 대표 비율을 곱한 ${appliedStressRate.toFixed(2)}%p를 가산한 단순 추정입니다. 혼합형·주기형의 실제 비율은 고정기간·변동주기와 만기에 따라 달라집니다.`);
  if (closingCosts.mode === "auto") warnings.push("등기·법무·채권·이사비는 견적 전 계획값입니다. 국민주택채권 할인액은 등기일 시가표준액과 당일 할인율에 따라 달라집니다.");
  if (input.companyLoanAmount > 0) warnings.push("회사대출이 사내기금인지 금융기관 연계대출인지에 따라 DSR과 담보대출 실행 순서가 달라질 수 있습니다.");
  if (input.roomDeduction === 0) warnings.push("방공제 또는 소액임차보증금 공제가 발생하면 LTV 한도가 더 줄어들 수 있습니다.");
  if (input.paidDeposit > input.purchasePrice) warnings.push("이미 낸 계약금이 매매가격보다 큽니다. 입력값을 다시 확인해 주세요.");
  if (input.existingAnnualInterest > input.existingAnnualDebtService) warnings.push("기존 대출의 연간 이자가 연간 원리금보다 큽니다. DTI·DSR 입력값을 다시 확인해 주세요.");

  return {
    policy,
    effectiveYears,
    termLimitWarning,
    permittedTerms,
    collateralBase,
    appliedStressRate,
    stressRateTypeRatio: stressRateTypeRatio(input.mortgageRateType, input.region),
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
