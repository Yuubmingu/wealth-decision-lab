import { describe, expect, it } from "vitest";
import {
  calculateCarCost,
  calculateDebtVsInvest,
  calculateGoalStrategy,
  calculateJobOffer,
  calculateRentFire,
  calculateSalaryCompound,
  futureValue,
  monthsToTarget,
  monthlyRate,
  monthlyLoanPayment,
  recurringFutureValue,
  requiredMonthlyContribution,
  validateNumericInputs,
} from "../app/lib/finance";
import {
  calculateHomePurchase,
  maximumBrokerFee,
  standardAcquisitionTaxRate,
  type HomePurchaseInputs,
} from "../app/lib/home-purchase";

describe("공통 복리 계산", () => {
  it("수익률 0%에서는 원금만 더한다", () => {
    expect(futureValue(1_000, 100, 0, 12)).toBe(2_200);
  });

  it("월 투자금이 0원이면 현재자산만 복리 운용한다", () => {
    expect(futureValue(10_000_000, 0, 6, 12)).toBeCloseTo(10_600_000, -2);
  });

  it("현재자산이 목표 이상이면 0개월이다", () => {
    expect(monthsToTarget(100, 0, 0, 100, 720)).toBe(0);
  });

  it("기간 내 도달하지 못하면 null이다", () => {
    expect(monthsToTarget(0, 1, 0, 1_000_000, 720)).toBeNull();
  });
});

describe("월세 절약 자산증가 계산", () => {
  const base = {
    monthlyIncome: 4_000_000,
    rent: 900_000,
    maintenance: 100_000,
    parking: 50_000,
    alternativeHousing: 750_000,
    currentAssets: 50_000_000,
    monthlyInvestment: 1_500_000,
    targetAssets: 1_000_000_000,
    annualRate: 6,
    investRate: 100,
    maxYears: 60,
  };

  it("대체 주거비가 비싸면 추가 투자액은 0원이다", () => {
    const result = calculateRentFire({ ...base, alternativeHousing: 1_500_000 });
    expect(result.housingDifference).toBeLessThan(0);
    expect(result.additionalInvestment).toBe(0);
  });

  it("월 30만원 절감액을 정확히 계산한다", () => {
    const result = calculateRentFire(base);
    expect(result.additionalInvestment).toBe(300_000);
    expect(result.milestones.find((item) => item.years === 15)?.value).toBeCloseTo(86_073_571, -1);
  });
});

describe("이직 오퍼 계산", () => {
  const base = {
    currentBase: 50_000_000,
    currentBonus: 10_000_000,
    currentBonusProbability: 0,
    currentCommute: 0,
    currentHousing: 0,
    currentOther: 0,
    offerBase: 60_000_000,
    offerBonus: 10_000_000,
    offerBonusProbability: 100,
    signingBonus: 0,
    offerCommute: 0,
    offerHousing: 0,
    offerOther: 0,
    afterTaxRate: 100,
    investRate: 100,
    annualRate: 6,
    careerExpansion: 4,
    rejobPotential: 4,
    stability: 3,
  };

  it("성과급 지급 확률 0%와 100%를 반영한다", () => {
    const result = calculateJobOffer(base);
    expect(result.currentExpected).toBe(50_000_000);
    expect(result.offerExpected).toBe(70_000_000);
  });

  it("총보상이 높아도 비용 증가가 크면 가처분소득은 감소한다", () => {
    const result = calculateJobOffer({ ...base, offerHousing: 2_000_000 });
    expect(result.offerExpected).toBeGreaterThan(result.currentExpected);
    expect(result.monthlyDisposableIncrease).toBeLessThan(0);
    expect(result.monthlyAdditionalInvestment).toBe(0);
    expect(result.verdict).toBe("보류");
  });

  it("3년 납입 후 12년 복리 시나리오가 공식과 일치한다", () => {
    const result = calculateJobOffer(base);
    const rate = monthlyRate(base.annualRate);
    const expected = recurringFutureValue(result.monthlyAdditionalInvestment, base.annualRate, 36) * Math.pow(1 + rate, 144);
    expect(result.conservative15Year).toBeCloseTo(expected, 5);
  });
});

describe("연봉 상승 계산", () => {
  it("투자비율 0%와 100%를 구분한다", () => {
    const zero = calculateSalaryCompound({ annualIncrease: 12_000_000, afterTaxRate: 100, investRate: 0, annualRate: 0, years: 3 });
    const all = calculateSalaryCompound({ annualIncrease: 12_000_000, afterTaxRate: 100, investRate: 100, annualRate: 0, years: 3 });
    expect(zero.monthlyAdditionalInvestment).toBe(0);
    expect(all.monthlyAdditionalInvestment).toBe(1_000_000);
    expect(all.milestones.find((item) => item.years === 3)?.value).toBe(36_000_000);
  });

  it("15년 기준 이정표를 계산한다", () => {
    const result = calculateSalaryCompound({
      annualIncrease: 10_000_000,
      afterTaxRate: 75,
      investRate: 70,
      annualRate: 6,
      years: 15,
    });
    expect(result.monthlyAdditionalInvestment).toBeCloseTo(437_500, 5);
    expect(result.milestones.find((item) => item.years === 15)?.value).toBeCloseTo(125_523_957, -1);
  });
});

describe("목표자산 전략 계산", () => {
  it("수익률 0%에서 필요한 월 투자금을 정확히 역산한다", () => {
    expect(requiredMonthlyContribution(0, 12_000_000, 0, 12)).toBe(1_000_000);
  });

  it("목표기간에 자산이 부족하면 월 부족분을 표시한다", () => {
    const result = calculateGoalStrategy({
      currentAssets: 0,
      monthlyInvestment: 500_000,
      targetAssets: 12_000_000,
      annualRate: 0,
      targetYears: 1,
    });
    expect(result.onTrack).toBe(false);
    expect(result.projectedAtTarget).toBe(6_000_000);
    expect(result.requiredMonthlyInvestment).toBe(1_000_000);
    expect(result.monthlyGap).toBe(500_000);
  });
});

describe("자동차 자산비용 계산", () => {
  it("무이자 할부금을 원금과 기간으로 나눈다", () => {
    expect(monthlyLoanPayment(12_000_000, 0, 12)).toBe(1_000_000);
  });

  it("운영비와 수익률이 0이면 차량 순구매비가 총비용이다", () => {
    const result = calculateCarCost({
      carPrice: 12_000_000,
      downPayment: 12_000_000,
      tradeIn: 0,
      loanRate: 0,
      loanYears: 1,
      insuranceAnnual: 0,
      taxAnnual: 0,
      fuelMonthly: 0,
      parkingMonthly: 0,
      maintenanceAnnual: 0,
      resaleValue: 0,
      holdingYears: 1,
      annualRate: 0,
      currentAssets: 0,
      monthlyInvestment: 0,
      targetAssets: 100_000_000,
    });
    expect(result.totalOwnershipCost).toBe(12_000_000);
    expect(result.opportunityCost15).toBe(12_000_000);
  });
});

describe("대출 상환과 투자 비교", () => {
  it("투자수익이 0%이면 이자가 있는 대출 상환이 앞선다", () => {
    const result = calculateDebtVsInvest({
      loanBalance: 100_000_000,
      loanRate: 5,
      remainingYears: 20,
      prepaymentAmount: 20_000_000,
      prepaymentFeeRate: 0,
      monthlyExtra: 0,
      expectedReturn: 0,
      horizonYears: 15,
    });
    expect(result.verdict).toBe("상환 우세");
    expect(result.repayNetWorth).toBeGreaterThan(result.investNetWorth);
    expect(result.interestSaved).toBeGreaterThan(0);
  });
});

describe("입력 검증", () => {
  it("빈 입력을 0으로 정규화한 값은 허용한다", () => {
    expect(validateNumericInputs({ value: 0 })).toBeNull();
  });
  it("음수는 거부한다", () => {
    expect(validateNumericInputs({ value: -1 })).toContain("음수");
  });
  it("매우 큰 금액도 유한한 값이면 계산한다", () => {
    expect(Number.isFinite(futureValue(1_000_000_000_000, 100_000_000, 20, 720))).toBe(true);
  });
});

describe("내 집 마련 필요현금 계산", () => {
  const base: HomePurchaseInputs = {
    purchasePrice: 900_000_000,
    appraisalValue: 880_000_000,
    areaM2: 84,
    houseType: "apartment",
    region: "capital-non-regulated",
    currentHouseCount: 0,
    disposeExisting: false,
    firstHome: true,
    policyLoan: "none",
    householdProfile: "general",
    annualIncome: 100_000_000,
    netAssets: 300_000_000,
    existingAnnualDebtService: 0,
    existingAnnualInterest: 0,
    availableCash: 300_000_000,
    paidDeposit: 50_000_000,
    companyLoanAmount: 0,
    companyLoanRate: 0,
    companyLoanYears: 10,
    companyLoanInDsr: true,
    mortgageRate: 4,
    mortgageYears: 30,
    dsrLimit: 40,
    stressRate: 3,
    roomDeduction: 0,
    seniorClaims: 0,
    taxMode: "auto",
    acquisitionTaxReduction: 0,
    legalFee: 0,
    bondDiscount: 0,
    movingReserve: 0,
  };

  it("1주택 일반 취득세율은 6억원 1%, 9억원 3%로 이어진다", () => {
    expect(standardAcquisitionTaxRate(600_000_000)).toBe(1);
    expect(standardAcquisitionTaxRate(750_000_000)).toBe(2);
    expect(standardAcquisitionTaxRate(900_000_000)).toBe(3);
  });

  it("저가주택 중개보수 상한액을 적용한다", () => {
    expect(maximumBrokerFee(40_000_000)).toBe(240_000);
    expect(maximumBrokerFee(100_000_000)).toBe(500_000);
    expect(maximumBrokerFee(900_000_000)).toBe(4_500_000);
  });

  it("수도권 생애최초 LTV는 70%이고 담보평가액을 기준으로 한다", () => {
    const result = calculateHomePurchase(base);
    const ltv = result.limits.find((limit) => limit.key === "ltv");
    expect(ltv?.value).toBe(616_000_000);
  });

  it("지방 비규제 생애최초 LTV는 80%를 적용한다", () => {
    const result = calculateHomePurchase({ ...base, region: "local-non-regulated", stressRate: 1.5 });
    const ltv = result.limits.find((limit) => limit.key === "ltv");
    expect(ltv?.value).toBe(704_000_000);
  });

  it("수도권에서 기존 주택을 처분하지 않으면 추가 구입 LTV는 0%다", () => {
    const result = calculateHomePurchase({ ...base, currentHouseCount: 1, firstHome: false });
    expect(result.policy.ltvRate).toBe(0);
    expect(result.finalMortgage).toBe(0);
  });

  it("방공제와 선순위채권을 LTV 한도에서 차감한다", () => {
    const result = calculateHomePurchase({ ...base, roomDeduction: 30_000_000, seniorClaims: 20_000_000 });
    const ltv = result.limits.find((limit) => limit.key === "ltv");
    expect(ltv?.value).toBe(566_000_000);
  });

  it("디딤돌 자격을 벗어나면 정책상품 한도는 0원이 된다", () => {
    const result = calculateHomePurchase({ ...base, policyLoan: "didimdol", purchasePrice: 700_000_000 });
    expect(result.policy.status).toBe("ineligible");
    expect(result.finalMortgage).toBe(0);
  });

  it("신혼가구 디딤돌은 기본요건 충족 시 3.2억원 상품한도를 사용한다", () => {
    const result = calculateHomePurchase({
      ...base,
      policyLoan: "didimdol",
      householdProfile: "newlywed",
      purchasePrice: 500_000_000,
      appraisalValue: 500_000_000,
      annualIncome: 80_000_000,
      netAssets: 300_000_000,
    });
    expect(result.policy.status).toBe("check");
    expect(result.policy.productCap).toBe(320_000_000);
    expect(result.finalMortgage).toBeLessThanOrEqual(320_000_000);
  });

  it("회사대출을 사용하면 필요 자기자금은 같은 금액만큼 줄어든다", () => {
    const withoutCompany = calculateHomePurchase(base);
    const withCompany = calculateHomePurchase({ ...base, companyLoanAmount: 50_000_000, companyLoanRate: 2, companyLoanInDsr: false });
    expect(withoutCompany.totalEquityNeeded - withCompany.totalEquityNeeded).toBe(50_000_000);
  });

  it("수도권 일반 주담대 40년 입력은 30년으로 제한한다", () => {
    const result = calculateHomePurchase({ ...base, mortgageYears: 40 });
    expect(result.effectiveYears).toBe(30);
    expect(result.termLimitWarning).toBe(true);
  });
});
