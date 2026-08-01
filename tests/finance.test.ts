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
  acquisitionTaxRate,
  calculateHomePurchase,
  effectiveStressRate,
  estimateClosingCosts,
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
    currentCashAllowance: 0,
    currentWelfarePoints: 0,
    currentMealBenefit: 0,
    currentTransportBenefit: 0,
    currentHousingBenefit: 0,
    offerBase: 60_000_000,
    offerBonus: 10_000_000,
    offerBonusProbability: 100,
    signingBonus: 0,
    offerCommute: 0,
    offerHousing: 0,
    offerOther: 0,
    offerCashAllowance: 0,
    offerWelfarePoints: 0,
    offerMealBenefit: 0,
    offerTransportBenefit: 0,
    offerHousingBenefit: 0,
    offerEquityAnnual: 0,
    offerEquityProbability: 0,
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
    expect(result.verdict).toBe("월 현금흐름 감소");
  });

  it("3년 납입 후 12년 복리 시나리오가 공식과 일치한다", () => {
    const result = calculateJobOffer(base);
    const rate = monthlyRate(base.annualRate);
    const expected = recurringFutureValue(result.monthlyAdditionalInvestment, base.annualRate, 36) * Math.pow(1 + rate, 144);
    expect(result.conservative15Year).toBeCloseTo(expected, 5);
  });

  it("주식보상은 총가치에는 포함하지만 가처분 현금에는 포함하지 않는다", () => {
    const withoutEquity = calculateJobOffer({ ...base, offerEquityAnnual: 0, offerEquityProbability: 100 });
    const withEquity = calculateJobOffer({ ...base, offerEquityAnnual: 100_000_000, offerEquityProbability: 100 });
    expect(withEquity.offerExpected - withoutEquity.offerExpected).toBe(100_000_000);
    expect(withEquity.monthlyDisposableIncrease).toBe(withoutEquity.monthlyDisposableIncrease);
  });

  it("커리어 자기평가 평균에 안정성을 포함한다", () => {
    const result = calculateJobOffer({ ...base, careerExpansion: 5, rejobPotential: 4, stability: 1 });
    expect(result.qualitativeAverage).toBeCloseTo(10 / 3, 8);
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

  it("서로 다른 자산 수익률을 각각 적용하고 추가 납입률을 일관되게 쓴다", () => {
    const input = {
      assets: [
        { id: "cash", label: "현금", enabled: true, currentValue: 12_000_000, monthlyContribution: 100_000, annualRate: 0 },
        { id: "stock", label: "주식", enabled: true, currentValue: 12_000_000, monthlyContribution: 300_000, annualRate: 8 },
      ],
      targetAssets: 100_000_000,
      targetYears: 5,
    };
    const result = calculateGoalStrategy(input);
    const expectedProjection = futureValue(12_000_000, 100_000, 0, 60) + futureValue(12_000_000, 300_000, 8, 60);
    expect(result.projectedAtTarget).toBeCloseTo(expectedProjection, 5);
    expect(result.contributionRate).toBeCloseTo(6, 8);
    expect(result.chart.at(-1)?.required).toBeCloseTo(input.targetAssets, 2);
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

  it("기존 차량 처분액은 할부원금을 줄이지만 경제적 구매비용에는 포함한다", () => {
    const result = calculateCarCost({ carPrice: 30_000_000, downPayment: 10_000_000, tradeIn: 5_000_000, loanRate: 0, loanYears: 5, insuranceAnnual: 0, taxAnnual: 0, fuelMonthly: 0, parkingMonthly: 0, maintenanceAnnual: 0, resaleValue: 0, holdingYears: 5, annualRate: 0, currentAssets: 50_000_000, monthlyInvestment: 0, targetAssets: 100_000_000 });
    expect(result.financedPrincipal).toBe(15_000_000);
    expect(result.tradeInApplied).toBe(5_000_000);
    expect(result.totalOwnershipCost).toBe(30_000_000);
  });

  it("보유기간이 할부기간보다 짧으면 그 기간 이자와 남은 대출잔액을 표시한다", () => {
    const result = calculateCarCost({ carPrice: 30_000_000, downPayment: 0, tradeIn: 0, loanRate: 6, loanYears: 5, insuranceAnnual: 0, taxAnnual: 0, fuelMonthly: 0, parkingMonthly: 0, maintenanceAnnual: 0, resaleValue: 15_000_000, holdingYears: 2, annualRate: 0, currentAssets: 50_000_000, monthlyInvestment: 1_000_000, targetAssets: 100_000_000 });
    expect(result.loanPaymentsDuringHolding).toBeCloseTo(result.loanPayment * 24, 5);
    expect(result.residualLoanBalance).toBeGreaterThan(0);
    expect(result.loanInterest).toBeLessThan(result.loanPayment * 60 - result.financedPrincipal);
  });

  it("차량 월비용이 투자 가능액보다 크면 음수 현금흐름으로 목표 달성이 늦어진다", () => {
    const result = calculateCarCost({ carPrice: 12_000_000, downPayment: 12_000_000, tradeIn: 0, loanRate: 0, loanYears: 1, insuranceAnnual: 0, taxAnnual: 0, fuelMonthly: 800_000, parkingMonthly: 0, maintenanceAnnual: 0, resaleValue: 0, holdingYears: 2, annualRate: 0, currentAssets: 1_000_000, monthlyInvestment: 100_000, targetAssets: 5_000_000 });
    expect(result.baselineMonths).toBe(40);
    expect(result.carMonths === null || result.carMonths > result.baselineMonths!).toBe(true);
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
      pessimisticReturn: 0,
      optimisticReturn: 0,
      monthlyIncome: 10_000_000,
      fixedExpenses: 0,
      currentCash: 20_000_000,
      emergencyMonths: 0,
      taxRate: 0,
      maxLossRate: 0,
      horizonYears: 15,
    });
    expect(result.verdict).toBe("상환 시나리오 순자산 높음");
    expect(result.repayNetWorth).toBeGreaterThan(result.investNetWorth);
    expect(result.interestSaved).toBeGreaterThan(0);
  });

  it("비상자금 목표를 침해하는 중도상환액을 사용 가능 현금으로 제한한다", () => {
    const result = calculateDebtVsInvest({ loanBalance: 100_000_000, loanRate: 5, remainingYears: 20, prepaymentAmount: 50_000_000, prepaymentFeeRate: 1, monthlyExtra: 0, expectedReturn: 5, pessimisticReturn: 0, optimisticReturn: 10, monthlyIncome: 5_000_000, fixedExpenses: 3_000_000, currentCash: 40_000_000, emergencyMonths: 12, taxRate: 15.4, maxLossRate: 30, horizonYears: 15 });
    expect(result.prepaymentLimited).toBe(true);
    expect(result.cashAfterRepay).toBeCloseTo(result.requiredReserve, 5);
  });

  it("월 추가 여유자금은 소득에서 고정지출과 정기상환액을 뺀 범위로 제한한다", () => {
    const result = calculateDebtVsInvest({ loanBalance: 100_000_000, loanRate: 5, remainingYears: 20, prepaymentAmount: 0, prepaymentFeeRate: 0, monthlyExtra: 3_000_000, expectedReturn: 5, pessimisticReturn: 0, optimisticReturn: 10, monthlyIncome: 3_000_000, fixedExpenses: 2_000_000, currentCash: 20_000_000, emergencyMonths: 6, taxRate: 15.4, maxLossRate: 30, horizonYears: 5 });
    expect(result.actualMonthlyExtra).toBeLessThanOrEqual(1_000_000);
    expect(result.monthlyExtraLimited).toBe(true);
  });

  it("손실 수익률에는 세금 환급을 가정하지 않고 손익분기도 같은 세후 규칙을 쓴다", () => {
    const result = calculateDebtVsInvest({ loanBalance: 100_000_000, loanRate: 5, remainingYears: 20, prepaymentAmount: 20_000_000, prepaymentFeeRate: 0, monthlyExtra: 0, expectedReturn: -10, pessimisticReturn: -20, optimisticReturn: 10, monthlyIncome: 10_000_000, fixedExpenses: 1_000_000, currentCash: 100_000_000, emergencyMonths: 6, taxRate: 50, maxLossRate: 30, horizonYears: 10 });
    expect(result.afterTaxExpectedReturn).toBe(-10);
    expect(result.breakEvenReturn).not.toBeNull();
    expect(result.breakEvenReturn!).toBeGreaterThan(result.nominalLoanRate);
  });

  it("투자 시나리오의 마지막 상환월에 남는 정기상환 예산도 투자한다", () => {
    const loanBalance = 1_000;
    const remainingYears = 1.1;
    const horizonYears = 2;
    const result = calculateDebtVsInvest({ loanBalance, loanRate: 0, remainingYears, prepaymentAmount: 0, prepaymentFeeRate: 0, monthlyExtra: 0, expectedReturn: 0, pessimisticReturn: 0, optimisticReturn: 0, monthlyIncome: 0, fixedExpenses: 0, currentCash: 0, emergencyMonths: 0, taxRate: 0, maxLossRate: 0, horizonYears });
    const scheduled = monthlyLoanPayment(loanBalance, 0, remainingYears * 12);
    expect(result.investNetWorth).toBeCloseTo(scheduled * horizonYears * 12 - loanBalance, 8);
  });

  it("두 시나리오의 절대 순자산과 차트에 사용 후 남은 현금을 공통으로 포함한다", () => {
    const base = {
      loanBalance: 100_000_000,
      loanRate: 5,
      remainingYears: 20,
      prepaymentAmount: 20_000_000,
      prepaymentFeeRate: 1,
      monthlyExtra: 300_000,
      expectedReturn: 6,
      pessimisticReturn: 0,
      optimisticReturn: 10,
      monthlyIncome: 6_000_000,
      fixedExpenses: 2_000_000,
      emergencyMonths: 0,
      taxRate: 15.4,
      maxLossRate: 30,
      horizonYears: 5,
    };
    const usedCash = base.prepaymentAmount * (1 + base.prepaymentFeeRate / 100);
    const sharedCash = 59_800_000;
    const withoutSharedCash = calculateDebtVsInvest({ ...base, currentCash: usedCash });
    const withSharedCash = calculateDebtVsInvest({ ...base, currentCash: usedCash + sharedCash });

    expect(withSharedCash.actualPrepayment).toBe(withoutSharedCash.actualPrepayment);
    expect(withSharedCash.repayNetWorth - withoutSharedCash.repayNetWorth).toBeCloseTo(sharedCash, 6);
    expect(withSharedCash.investNetWorth - withoutSharedCash.investNetWorth).toBeCloseTo(sharedCash, 6);
    expect(withSharedCash.difference).toBeCloseTo(withoutSharedCash.difference, 6);
    expect(withSharedCash.chart).toHaveLength(withoutSharedCash.chart.length);
    withSharedCash.chart.forEach((point, index) => {
      expect(point.repay - withoutSharedCash.chart[index].repay).toBeCloseTo(sharedCash, 6);
      expect(point.invest - withoutSharedCash.chart[index].invest).toBeCloseTo(sharedCash, 6);
    });
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
    householdProfile: "general",
    applicantAge: 35,
    singleHousehold: false,
    bogeumjariActualUser: false,
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
    mortgageRateType: "variable",
    mortgageYears: 30,
    dsrLimit: 40,
    stressRate: 3,
    roomDeduction: 0,
    seniorClaims: 0,
    taxMode: "auto",
    acquisitionTaxReduction: 0,
    costEstimateMode: "auto",
    legalFee: 0,
    bondDiscount: 0,
    movingReserve: 0,
    extraClosingCosts: 0,
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

  it("일반 생애최초 취득세는 최대 200만원이고 지방교육세도 같은 비율로 감면한다", () => {
    const result = calculateHomePurchase(base);
    expect(result.tax.firstHomeReduction).toBe(2_000_000);
    expect(result.tax.acquisitionTax).toBe(25_000_000);
    expect(result.tax.grossLocalEducationTax).toBe(2_700_000);
    expect(result.tax.localEducationTaxReduction).toBe(200_000);
    expect(result.tax.localEducationTax).toBe(2_500_000);
  });

  it("법정 소형 비아파트 생애최초 특례는 최대 300만원을 적용한다", () => {
    const result = calculateHomePurchase({
      ...base,
      purchasePrice: 500_000_000,
      appraisalValue: 500_000_000,
      marketPrice: 500_000_000,
      areaM2: 59,
      houseType: "other",
      firstHomeTaxReliefCategory: "small-non-apartment",
    });
    expect(result.tax.firstHomeReliefCap).toBe(3_000_000);
    expect(result.tax.firstHomeReduction).toBe(3_000_000);
    expect(result.tax.localEducationTaxReduction).toBe(300_000);
  });

  it("생애최초 감면과 별도 감면 입력을 중복 합산하지 않는다", () => {
    const automaticWins = calculateHomePurchase({ ...base, acquisitionTaxReduction: 1_000_000 });
    expect(automaticWins.tax.firstHomeReduction).toBe(2_000_000);
    expect(automaticWins.tax.manualReduction).toBe(0);
    expect(automaticWins.tax.acquisitionTax).toBe(25_000_000);

    const manualWins = calculateHomePurchase({ ...base, acquisitionTaxReduction: 3_000_000 });
    expect(manualWins.tax.firstHomeReduction).toBe(0);
    expect(manualWins.tax.manualReduction).toBe(3_000_000);
    expect(manualWins.tax.acquisitionTax).toBe(24_000_000);
  });

  it("미성년자이거나 본인 거주 목적이 아니면 생애최초 취득세 감면을 적용하지 않는다", () => {
    expect(calculateHomePurchase({ ...base, applicantAge: 18 }).tax.firstHomeReduction).toBe(0);
    expect(calculateHomePurchase({ ...base, willOccupyHome: false }).tax.firstHomeReduction).toBe(0);
  });

  it("기존 1주택을 기한 내 처분하는 일시적 2주택은 자동 계산에서 일반세율을 쓴다", () => {
    expect(acquisitionTaxRate({
      purchasePrice: 900_000_000,
      region: "seoul",
      currentHouseCount: 1,
      disposeExisting: true,
      taxMode: "auto",
    })).toBe(3);
    expect(acquisitionTaxRate({
      purchasePrice: 900_000_000,
      region: "seoul",
      currentHouseCount: 1,
      disposeExisting: false,
      taxMode: "auto",
    })).toBe(8);
  });

  it("농어촌특별세는 중과 여부와 관계없이 전용 85㎡ 초과 주택에만 추정한다", () => {
    expect(calculateHomePurchase({ ...base, firstHome: false, areaM2: 84, taxMode: "eight" }).tax.ruralSpecialTax).toBe(0);
    expect(calculateHomePurchase({ ...base, firstHome: false, areaM2: 84, taxMode: "twelve" }).tax.ruralSpecialTax).toBe(0);
    expect(calculateHomePurchase({ ...base, firstHome: false, areaM2: 86, taxMode: "eight" }).tax.ruralSpecialTax).toBeCloseTo(base.purchasePrice * 0.006, 2);
    expect(calculateHomePurchase({ ...base, firstHome: false, areaM2: 86, taxMode: "twelve" }).tax.ruralSpecialTax).toBeCloseTo(base.purchasePrice * 0.01, 2);
  });

  it("부대비용 자동 추정은 계획값을 만들고 실제 견적 모드에서는 입력값을 쓴다", () => {
    const automatic = estimateClosingCosts(base);
    expect(automatic.mode).toBe("auto");
    expect(automatic.legalFee).toBeGreaterThan(0);
    const manual = estimateClosingCosts({ ...base, costEstimateMode: "manual", legalFee: 1_200_000, bondDiscount: 800_000, movingReserve: 2_500_000, extraClosingCosts: 300_000 });
    expect(manual).toMatchObject({ mode: "manual", legalFee: 1_200_000, bondDiscount: 800_000, movingReserve: 2_500_000, extraClosingCosts: 300_000 });
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

  it("스트레스 DSR은 지역 단계와 대출 금리유형별 비율을 함께 반영한다", () => {
    expect(effectiveStressRate({ region: "capital-non-regulated", mortgageRateType: "variable", stressRate: 3 })).toBe(3);
    expect(effectiveStressRate({ region: "capital-non-regulated", mortgageRateType: "mixed", stressRate: 3 })).toBeCloseTo(2.4);
    expect(effectiveStressRate({ region: "capital-non-regulated", mortgageRateType: "periodic", stressRate: 3 })).toBeCloseTo(1.2);
    expect(effectiveStressRate({ region: "capital-non-regulated", mortgageRateType: "fixed", stressRate: 3 })).toBe(0);
    expect(effectiveStressRate({ region: "local-non-regulated", mortgageRateType: "variable", stressRate: 1.5 })).toBeCloseTo(0.75);
    expect(effectiveStressRate({ region: "local-non-regulated", mortgageRateType: "mixed", stressRate: 1.5 })).toBeCloseTo(0.45);

    const variable = calculateHomePurchase(base).limits.find((limit) => limit.key === "dsr")?.value ?? 0;
    const fixed = calculateHomePurchase({ ...base, mortgageRateType: "fixed" }).limits.find((limit) => limit.key === "dsr")?.value ?? 0;
    expect(fixed).toBeGreaterThan(variable);
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

  it("디딤돌은 입력과 상환 예시 모두 10·15·20·30년만 허용한다", () => {
    const result = calculateHomePurchase({
      ...base,
      policyLoan: "didimdol",
      purchasePrice: 400_000_000,
      appraisalValue: 400_000_000,
      marketPrice: 400_000_000,
      annualIncome: 60_000_000,
      mortgageYears: 50,
    });
    expect(result.effectiveYears).toBe(30);
    expect(result.termLimitWarning).toBe(true);
    expect(result.repaymentScenarios.map((scenario) => scenario.years)).toEqual([10, 15, 20, 30]);
  });

  it("만 30세 이상 미혼 단독세대주 디딤돌의 별도 가격·면적·한도를 적용한다", () => {
    const eligible = calculateHomePurchase({
      ...base,
      policyLoan: "didimdol",
      purchasePrice: 300_000_000,
      appraisalValue: 300_000_000,
      marketPrice: 300_000_000,
      areaM2: 60,
      annualIncome: 60_000_000,
      applicantAge: 30,
      singleHousehold: true,
    });
    expect(eligible.policy.status).toBe("check");
    expect(eligible.policy.productCap).toBe(200_000_000);

    const tooYoung = calculateHomePurchase({
      ...base,
      policyLoan: "didimdol",
      purchasePrice: 250_000_000,
      appraisalValue: 250_000_000,
      marketPrice: 250_000_000,
      areaM2: 50,
      annualIncome: 50_000_000,
      applicantAge: 29,
      singleHousehold: true,
    });
    expect(tooYoung.policy.status).toBe("ineligible");
  });

  it("수도권 밖 읍·면 디딤돌은 일반가구 100㎡·단독세대주 70㎡까지 진단한다", () => {
    const ruralGeneral = calculateHomePurchase({
      ...base,
      policyLoan: "didimdol",
      region: "local-non-regulated",
      isRuralTown: true,
      purchasePrice: 400_000_000,
      appraisalValue: 400_000_000,
      marketPrice: 400_000_000,
      areaM2: 99,
      annualIncome: 60_000_000,
      stressRate: 1.5,
    });
    expect(ruralGeneral.policy.status).toBe("check");

    const ruralSingle = calculateHomePurchase({
      ...base,
      policyLoan: "didimdol",
      region: "local-non-regulated",
      isRuralTown: true,
      purchasePrice: 300_000_000,
      appraisalValue: 300_000_000,
      marketPrice: 300_000_000,
      areaM2: 70,
      annualIncome: 60_000_000,
      applicantAge: 30,
      singleHousehold: true,
      stressRate: 1.5,
    });
    expect(ruralSingle.policy.status).toBe("check");
  });

  it("보금자리론은 매매가·평가액·시세 중 하나라도 6억원을 넘으면 제외한다", () => {
    const result = calculateHomePurchase({
      ...base,
      policyLoan: "bogeumjari",
      purchasePrice: 590_000_000,
      appraisalValue: 610_000_000,
      marketPrice: 580_000_000,
      annualIncome: 70_000_000,
    });
    expect(result.policy.status).toBe("ineligible");
    expect(result.finalMortgage).toBe(0);
  });

  it("규제지역 보금자리론은 생애최초·확인된 실수요자 외에는 LTV·DTI를 10%p 낮춘다", () => {
    const conservative = calculateHomePurchase({
      ...base,
      policyLoan: "bogeumjari",
      region: "seoul",
      purchasePrice: 500_000_000,
      appraisalValue: 500_000_000,
      marketPrice: 500_000_000,
      annualIncome: 60_000_000,
      firstHome: false,
      bogeumjariActualUser: false,
    });
    expect(conservative.policy.ltvRate).toBe(60);
    expect(conservative.policy.dtiRate).toBe(50);

    const actualUser = calculateHomePurchase({
      ...base,
      policyLoan: "bogeumjari",
      region: "seoul",
      purchasePrice: 500_000_000,
      appraisalValue: 500_000_000,
      marketPrice: 500_000_000,
      annualIncome: 60_000_000,
      firstHome: false,
      bogeumjariActualUser: true,
    });
    expect(actualUser.policy.ltvRate).toBe(70);
    expect(actualUser.policy.dtiRate).toBe(60);
  });

  it("보금자리론 40·50년 만기는 일반·신혼가구의 연령 상한을 각각 적용한다", () => {
    const common = {
      ...base,
      policyLoan: "bogeumjari" as const,
      purchasePrice: 500_000_000,
      appraisalValue: 500_000_000,
      marketPrice: 500_000_000,
      annualIncome: 60_000_000,
    };
    expect(calculateHomePurchase({ ...common, householdProfile: "general", applicantAge: 39, mortgageYears: 40 }).policy.status).toBe("check");
    expect(calculateHomePurchase({ ...common, householdProfile: "general", applicantAge: 40, mortgageYears: 40 }).policy.status).toBe("ineligible");
    expect(calculateHomePurchase({ ...common, householdProfile: "newlywed", applicantAge: 49, mortgageYears: 40 }).policy.status).toBe("check");
    expect(calculateHomePurchase({ ...common, householdProfile: "newlywed", applicantAge: 50, mortgageYears: 40 }).policy.status).toBe("ineligible");
    expect(calculateHomePurchase({ ...common, householdProfile: "newlywed", applicantAge: 39, mortgageYears: 50 }).policy.status).toBe("check");
    expect(calculateHomePurchase({ ...common, householdProfile: "newlywed", applicantAge: 40, mortgageYears: 50 }).policy.status).toBe("ineligible");
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
