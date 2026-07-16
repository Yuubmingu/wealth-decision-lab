export const DEFAULT_MAX_MONTHS = 720;

export function monthlyRate(annualRatePercent: number) {
  return Math.pow(1 + annualRatePercent / 100, 1 / 12) - 1;
}

export function futureValue(
  currentAssets: number,
  monthlyContribution: number,
  annualRatePercent: number,
  months: number,
) {
  const rate = monthlyRate(annualRatePercent);
  if (rate === 0) return currentAssets + monthlyContribution * months;
  return (
    currentAssets * Math.pow(1 + rate, months) +
    monthlyContribution * ((Math.pow(1 + rate, months) - 1) / rate)
  );
}

export function recurringFutureValue(
  monthlyContribution: number,
  annualRatePercent: number,
  months: number,
) {
  return futureValue(0, monthlyContribution, annualRatePercent, months);
}

export function monthsToTarget(
  currentAssets: number,
  monthlyContribution: number,
  annualRatePercent: number,
  targetAssets: number,
  maxMonths = DEFAULT_MAX_MONTHS,
) {
  if (currentAssets >= targetAssets) return 0;
  for (let month = 1; month <= maxMonths; month += 1) {
    if (
      futureValue(currentAssets, monthlyContribution, annualRatePercent, month) >=
      targetAssets
    ) {
      return month;
    }
  }
  return null;
}

export type RentInputs = {
  monthlyIncome: number;
  rent: number;
  maintenance: number;
  parking: number;
  alternativeHousing: number;
  currentAssets: number;
  monthlyInvestment: number;
  targetAssets: number;
  annualRate: number;
  investRate: number;
  maxYears: number;
};

export function calculateRentFire(input: RentInputs) {
  const currentHousing = input.rent + input.maintenance + input.parking;
  const housingRatio = input.monthlyIncome
    ? (currentHousing / input.monthlyIncome) * 100
    : 0;
  const housingDifference = currentHousing - input.alternativeHousing;
  const additionalInvestment = Math.max(
    housingDifference * (input.investRate / 100),
    0,
  );
  const maxMonths = input.maxYears * 12;
  const currentMonths = monthsToTarget(
    input.currentAssets,
    input.monthlyInvestment,
    input.annualRate,
    input.targetAssets,
    maxMonths,
  );
  const alternativeMonths = monthsToTarget(
    input.currentAssets,
    input.monthlyInvestment + additionalInvestment,
    input.annualRate,
    input.targetAssets,
    maxMonths,
  );
  const shortenedMonths =
    currentMonths !== null && alternativeMonths !== null
      ? Math.max(currentMonths - alternativeMonths, 0)
      : null;

  const milestones = [5, 10, 15].map((years) => ({
    years,
    value: recurringFutureValue(
      additionalInvestment,
      input.annualRate,
      years * 12,
    ),
  }));

  const chart = Array.from({ length: Math.min(input.maxYears, 30) + 1 }, (_, year) => ({
    year,
    current: futureValue(
      input.currentAssets,
      input.monthlyInvestment,
      input.annualRate,
      year * 12,
    ),
    alternative: futureValue(
      input.currentAssets,
      input.monthlyInvestment + additionalInvestment,
      input.annualRate,
      year * 12,
    ),
  }));

  const scenarios = [input.monthlyInvestment, 1_300_000, 1_800_000, 2_500_000]
    .filter((value, index, values) => values.indexOf(value) === index)
    .map((monthly) => ({
      monthly,
      months: monthsToTarget(
        input.currentAssets,
        monthly,
        input.annualRate,
        input.targetAssets,
        maxMonths,
      ),
    }));

  return {
    currentHousing,
    housingRatio,
    housingDifference,
    additionalInvestment,
    currentMonths,
    alternativeMonths,
    shortenedMonths,
    milestones,
    chart,
    scenarios,
  };
}

export type JobOfferInputs = {
  currentBase: number;
  currentBonus: number;
  currentBonusProbability: number;
  currentCommute: number;
  currentHousing: number;
  currentOther: number;
  currentCashAllowance: number;
  currentWelfarePoints: number;
  currentMealBenefit: number;
  currentTransportBenefit: number;
  currentHousingBenefit: number;
  offerBase: number;
  offerBonus: number;
  offerBonusProbability: number;
  signingBonus: number;
  offerCommute: number;
  offerHousing: number;
  offerOther: number;
  offerCashAllowance: number;
  offerWelfarePoints: number;
  offerMealBenefit: number;
  offerTransportBenefit: number;
  offerHousingBenefit: number;
  offerEquityAnnual: number;
  offerEquityProbability: number;
  afterTaxRate: number;
  investRate: number;
  annualRate: number;
  careerExpansion: number;
  rejobPotential: number;
  stability: number;
};

export function calculateJobOffer(input: JobOfferInputs) {
  const currentBenefits = (input.currentCashAllowance ?? 0) + (input.currentWelfarePoints ?? 0) + (input.currentMealBenefit ?? 0) + (input.currentTransportBenefit ?? 0) + (input.currentHousingBenefit ?? 0);
  const offerBenefits = (input.offerCashAllowance ?? 0) + (input.offerWelfarePoints ?? 0) + (input.offerMealBenefit ?? 0) + (input.offerTransportBenefit ?? 0) + (input.offerHousingBenefit ?? 0);
  const expectedEquity = (input.offerEquityAnnual ?? 0) * ((input.offerEquityProbability ?? 0) / 100);
  const currentExpected =
    input.currentBase + input.currentBonus * (input.currentBonusProbability / 100) + currentBenefits;
  const offerExpected =
    input.offerBase + input.offerBonus * (input.offerBonusProbability / 100) + offerBenefits + expectedEquity;
  const baseDifference = input.offerBase - input.currentBase;
  const baseIncreaseRate = input.currentBase
    ? (baseDifference / input.currentBase) * 100
    : 0;
  const expectedDifference = offerExpected - currentExpected;
  const afterTaxAnnualDifference = expectedDifference * (input.afterTaxRate / 100);
  const monthlyCostDifference =
    input.offerCommute - input.currentCommute +
    (input.offerHousing - input.currentHousing) +
    (input.offerOther - input.currentOther);
  const monthlyDisposableIncrease = afterTaxAnnualDifference / 12 - monthlyCostDifference;
  const monthlyAdditionalInvestment = Math.max(
    monthlyDisposableIncrease * (input.investRate / 100),
    0,
  );
  const threeYearPrincipal = monthlyAdditionalInvestment * 36;
  const rate = monthlyRate(input.annualRate);
  const conservative15Year =
    recurringFutureValue(monthlyAdditionalInvestment, input.annualRate, 36) *
    Math.pow(1 + rate, 144);
  const continuous15Year = recurringFutureValue(
    monthlyAdditionalInvestment,
    input.annualRate,
    180,
  );
  const investedSigning =
    input.signingBonus * (input.afterTaxRate / 100) * (input.investRate / 100);
  const signingFutureValue = investedSigning * Math.pow(1 + rate, 180);
  const qualitativeAverage = (input.careerExpansion + input.rejobPotential) / 2;
  const rules = [
    baseIncreaseRate >= 10,
    monthlyDisposableIncrease > 0,
    qualitativeAverage >= 4,
  ];
  const metCount = rules.filter(Boolean).length;
  const verdict =
    monthlyDisposableIncrease < 0 || metCount <= 1
      ? "보류"
      : metCount === 3
        ? "이직 우세"
        : "조건부 검토";

  return {
    currentExpected,
    offerExpected,
    baseDifference,
    baseIncreaseRate,
    expectedDifference,
    monthlyCostDifference,
    monthlyDisposableIncrease,
    monthlyAdditionalInvestment,
    threeYearPrincipal,
    conservative15Year,
    continuous15Year,
    signingFutureValue,
    qualitativeAverage,
    rules,
    verdict,
    currentBenefits,
    offerBenefits,
    expectedEquity,
  };
}

export type SalaryInputs = {
  annualIncrease: number;
  afterTaxRate: number;
  investRate: number;
  annualRate: number;
  years: number;
};

export function calculateSalaryCompound(input: SalaryInputs) {
  const afterTaxAnnualIncrease = input.annualIncrease * (input.afterTaxRate / 100);
  const monthlyAfterTaxIncrease = afterTaxAnnualIncrease / 12;
  const monthlyAdditionalInvestment = monthlyAfterTaxIncrease * (input.investRate / 100);
  const monthlyAdditionalConsumption = monthlyAfterTaxIncrease - monthlyAdditionalInvestment;
  const periods = Array.from(new Set([3, 10, 15, input.years])).sort((a, b) => a - b);
  const milestones = periods.map((years) => {
    const months = years * 12;
    const principal = monthlyAdditionalInvestment * months;
    const value = recurringFutureValue(
      monthlyAdditionalInvestment,
      input.annualRate,
      months,
    );
    return { years, principal, value, returnValue: value - principal };
  });
  const ratioScenarios = [0, 30, 50, 70, 100].map((rate) => ({
    rate,
    value: recurringFutureValue(
      monthlyAfterTaxIncrease * (rate / 100),
      input.annualRate,
      input.years * 12,
    ),
  }));

  return {
    afterTaxAnnualIncrease,
    monthlyAfterTaxIncrease,
    monthlyAdditionalInvestment,
    monthlyAdditionalConsumption,
    milestones,
    ratioScenarios,
  };
}

export type GoalAsset = {
  id: string;
  label: string;
  enabled: boolean;
  currentValue: number;
  monthlyContribution: number;
  annualRate: number;
  monthlyIncome?: number;
};

export type GoalStrategyInputs = {
  assets?: GoalAsset[];
  currentAssets?: number;
  monthlyInvestment?: number;
  annualRate?: number;
  targetAssets: number;
  targetYears: number;
};

export function requiredMonthlyContribution(
  currentAssets: number,
  targetAssets: number,
  annualRatePercent: number,
  months: number,
) {
  if (months <= 0 || currentAssets >= targetAssets) return 0;
  const rate = monthlyRate(annualRatePercent);
  if (rate === 0) return Math.max((targetAssets - currentAssets) / months, 0);
  const grownAssets = currentAssets * Math.pow(1 + rate, months);
  return Math.max(
    ((targetAssets - grownAssets) * rate) /
      (Math.pow(1 + rate, months) - 1),
    0,
  );
}

export function calculateGoalStrategy(input: GoalStrategyInputs) {
  const targetMonths = input.targetYears * 12;
  const enabled = input.assets?.filter((asset) => asset.enabled) ?? [{ id: "legacy", label: "금융자산", enabled: true, currentValue: input.currentAssets ?? 0, monthlyContribution: input.monthlyInvestment ?? 0, annualRate: input.annualRate ?? 0 }];
  const currentAssets = enabled.reduce((sum, asset) => sum + asset.currentValue, 0);
  const monthlyInvestment = enabled.reduce((sum, asset) => sum + asset.monthlyContribution + (asset.monthlyIncome ?? 0), 0);
  const weightedRate = currentAssets > 0
    ? enabled.reduce((sum, asset) => sum + asset.currentValue * asset.annualRate, 0) / currentAssets
    : enabled.length ? enabled.reduce((sum, asset) => sum + asset.annualRate, 0) / enabled.length : 0;
  const valueAt = (months: number) => enabled.reduce((sum, asset) => sum + futureValue(asset.currentValue, asset.monthlyContribution + (asset.monthlyIncome ?? 0), asset.annualRate, months), 0);
  const projectedAtTarget = valueAt(targetMonths);
  let currentMonths: number | null = currentAssets >= input.targetAssets ? 0 : null;
  for (let month = 1; currentMonths === null && month <= DEFAULT_MAX_MONTHS; month += 1) if (valueAt(month) >= input.targetAssets) currentMonths = month;
  const requiredMonthlyInvestment = requiredMonthlyContribution(
    currentAssets,
    input.targetAssets,
    weightedRate,
    targetMonths,
  );
  const monthlyGap = Math.max(
    requiredMonthlyInvestment - monthlyInvestment,
    0,
  );
  const assetGap = Math.max(input.targetAssets - projectedAtTarget, 0);
  const onTrack = projectedAtTarget >= input.targetAssets;
  const scenarios = [Math.max(weightedRate - 2, 0), weightedRate, weightedRate + 2].map((rate) => ({
    rate,
    value: futureValue(
      currentAssets,
      monthlyInvestment,
      rate,
      targetMonths,
    ),
    months: monthsToTarget(
      currentAssets,
      monthlyInvestment,
      rate,
      input.targetAssets,
      DEFAULT_MAX_MONTHS,
    ),
  }));
  const chart = Array.from({ length: input.targetYears + 1 }, (_, year) => ({
    year,
    current: futureValue(
      0, 0, 0, 0,
    ),
    required: futureValue(
      currentAssets,
      requiredMonthlyInvestment,
      weightedRate,
      year * 12,
    ),
  }));
  chart.forEach((point) => { point.current = valueAt(point.year * 12); });
  const assetBreakdown = enabled.map((asset) => ({ label: asset.label, value: futureValue(asset.currentValue, asset.monthlyContribution + (asset.monthlyIncome ?? 0), asset.annualRate, targetMonths) }));
  const largestShare = currentAssets ? Math.max(...enabled.map((asset) => asset.currentValue / currentAssets * 100), 0) : 0;

  return {
    projectedAtTarget,
    currentMonths,
    requiredMonthlyInvestment,
    monthlyGap,
    assetGap,
    onTrack,
    scenarios,
    chart,
    currentAssets,
    monthlyInvestment,
    weightedRate,
    assetBreakdown,
    largestShare,
  };
}

export function monthlyLoanPayment(
  principal: number,
  annualRatePercent: number,
  months: number,
) {
  if (principal <= 0 || months <= 0) return 0;
  const rate = annualRatePercent / 100 / 12;
  if (rate === 0) return principal / months;
  return (
    (principal * rate * Math.pow(1 + rate, months)) /
    (Math.pow(1 + rate, months) - 1)
  );
}

export type CarCostInputs = {
  carPrice: number;
  downPayment: number;
  tradeIn: number;
  loanRate: number;
  loanYears: number;
  insuranceAnnual: number;
  taxAnnual: number;
  fuelMonthly: number;
  parkingMonthly: number;
  maintenanceAnnual: number;
  resaleValue: number;
  holdingYears: number;
  annualRate: number;
  currentAssets: number;
  monthlyInvestment: number;
  targetAssets: number;
};

function monthsToTargetWithCar(
  input: CarCostInputs,
  upfrontCash: number,
  loanPayment: number,
  operatingMonthly: number,
) {
  let assets = Math.max(input.currentAssets - upfrontCash, 0);
  const rate = monthlyRate(input.annualRate);
  const holdingMonths = input.holdingYears * 12;
  const loanMonths = input.loanYears * 12;
  if (assets >= input.targetAssets) return 0;
  for (let month = 1; month <= DEFAULT_MAX_MONTHS; month += 1) {
    assets *= 1 + rate;
    let availableInvestment = input.monthlyInvestment;
    if (month <= holdingMonths) availableInvestment -= operatingMonthly;
    if (month <= loanMonths) availableInvestment -= loanPayment;
    assets += Math.max(availableInvestment, 0);
    if (month === holdingMonths) assets += input.resaleValue;
    if (assets >= input.targetAssets) return month;
  }
  return null;
}

export function calculateCarCost(input: CarCostInputs) {
  const upfrontCash = Math.max(input.downPayment - input.tradeIn, 0);
  const financedPrincipal = Math.max(input.carPrice - input.downPayment, 0);
  const loanMonths = input.loanYears * 12;
  const holdingMonths = input.holdingYears * 12;
  const loanPayment = monthlyLoanPayment(
    financedPrincipal,
    input.loanRate,
    loanMonths,
  );
  const loanTotalPaid = loanPayment * loanMonths;
  const loanInterest = Math.max(loanTotalPaid - financedPrincipal, 0);
  const operatingMonthly =
    input.fuelMonthly +
    input.parkingMonthly +
    (input.insuranceAnnual + input.taxAnnual + input.maintenanceAnnual) / 12;
  const runningCostFirstMonth = loanPayment + operatingMonthly;
  const operatingTotal = operatingMonthly * holdingMonths;
  const totalOwnershipCost = Math.max(
    upfrontCash + loanTotalPaid + operatingTotal - input.resaleValue,
    0,
  );

  const investmentRate = monthlyRate(input.annualRate);
  const horizonMonths = holdingMonths;
  let opportunityCost15 = upfrontCash * Math.pow(1 + investmentRate, horizonMonths);
  for (let month = 1; month <= Math.min(holdingMonths, horizonMonths); month += 1) {
    const monthlyCost = operatingMonthly + (month <= loanMonths ? loanPayment : 0);
    opportunityCost15 +=
      monthlyCost * Math.pow(1 + investmentRate, horizonMonths - month);
  }
  if (holdingMonths <= horizonMonths) {
    opportunityCost15 -=
      input.resaleValue *
      Math.pow(1 + investmentRate, horizonMonths - holdingMonths);
  }
  opportunityCost15 = Math.max(opportunityCost15, 0);

  const baselineMonths = monthsToTarget(
    input.currentAssets,
    input.monthlyInvestment,
    input.annualRate,
    input.targetAssets,
    DEFAULT_MAX_MONTHS,
  );
  const carMonths = monthsToTargetWithCar(
    input,
    upfrontCash,
    loanPayment,
    operatingMonthly,
  );
  const delayedMonths =
    baselineMonths !== null && carMonths !== null
      ? Math.max(carMonths - baselineMonths, 0)
      : null;
  const costBreakdown = [
    { name: "차량 순구매비", value: Math.max(upfrontCash + financedPrincipal - input.resaleValue, 0) },
    { name: "할부이자", value: loanInterest },
    { name: "보험·세금·정비", value: ((input.insuranceAnnual + input.taxAnnual + input.maintenanceAnnual) / 12) * holdingMonths },
    { name: "유류·주차", value: (input.fuelMonthly + input.parkingMonthly) * holdingMonths },
  ];

  return {
    upfrontCash,
    financedPrincipal,
    loanPayment,
    loanInterest,
    operatingMonthly,
    runningCostFirstMonth,
    operatingTotal,
    totalOwnershipCost,
    opportunityCost15,
    baselineMonths,
    carMonths,
    delayedMonths,
    costBreakdown,
  };
}

export type DebtVsInvestInputs = {
  loanBalance: number;
  loanRate: number;
  remainingYears: number;
  prepaymentAmount: number;
  prepaymentFeeRate: number;
  monthlyExtra: number;
  expectedReturn: number;
  pessimisticReturn: number;
  optimisticReturn: number;
  monthlyIncome: number;
  fixedExpenses: number;
  currentCash: number;
  emergencyMonths: number;
  taxRate: number;
  maxLossRate: number;
  horizonYears: number;
};

type DebtSimulationPoint = {
  year: number;
  repay: number;
  invest: number;
};

function simulateDebtDecision(
  input: DebtVsInvestInputs,
  expectedReturn: number,
) {
  const loanMonths = input.remainingYears * 12;
  const horizonMonths = input.horizonYears * 12;
  const loanMonthlyRate = input.loanRate / 100 / 12;
  const investmentMonthlyRate = monthlyRate(expectedReturn);
  const prepayment = Math.min(input.prepaymentAmount, input.loanBalance);
  const fee = prepayment * (input.prepaymentFeeRate / 100);
  const scheduledPayment = monthlyLoanPayment(
    input.loanBalance,
    input.loanRate,
    loanMonths,
  );
  let investDebt = input.loanBalance;
  let repayDebt = Math.max(input.loanBalance - prepayment, 0);
  let investAssets = prepayment + fee;
  let repayAssets = 0;
  let investInterest = 0;
  let repayInterest = 0;
  let repayPayoffMonth: number | null = repayDebt === 0 ? 0 : null;
  let investPayoffMonth: number | null = investDebt === 0 ? 0 : null;
  const chart: DebtSimulationPoint[] = [
    { year: 0, repay: repayAssets - repayDebt, invest: investAssets - investDebt },
  ];

  for (let month = 1; month <= horizonMonths; month += 1) {
    investAssets *= 1 + investmentMonthlyRate;
    repayAssets *= 1 + investmentMonthlyRate;

    if (investDebt > 0) {
      const interest = investDebt * loanMonthlyRate;
      investInterest += interest;
      investDebt += interest;
      const payment = Math.min(scheduledPayment, investDebt);
      investDebt -= payment;
      investAssets += input.monthlyExtra;
      if (investDebt <= 0.01) {
        investDebt = 0;
        investPayoffMonth = month;
      }
    } else {
      investAssets += input.monthlyExtra + scheduledPayment;
    }

    if (repayDebt > 0) {
      const interest = repayDebt * loanMonthlyRate;
      repayInterest += interest;
      repayDebt += interest;
      const payment = Math.min(
        scheduledPayment + input.monthlyExtra,
        repayDebt,
      );
      repayDebt -= payment;
      const unusedBudget = scheduledPayment + input.monthlyExtra - payment;
      repayAssets += Math.max(unusedBudget, 0);
      if (repayDebt <= 0.01) {
        repayDebt = 0;
        repayPayoffMonth = month;
      }
    } else {
      repayAssets += input.monthlyExtra + scheduledPayment;
    }

    if (month % 12 === 0) {
      chart.push({
        year: month / 12,
        repay: repayAssets - repayDebt,
        invest: investAssets - investDebt,
      });
    }
  }

  return {
    fee,
    scheduledPayment,
    repayNetWorth: repayAssets - repayDebt,
    investNetWorth: investAssets - investDebt,
    repayInterest,
    investInterest,
    interestSaved: Math.max(investInterest - repayInterest, 0),
    repayPayoffMonth,
    investPayoffMonth,
    chart,
  };
}

export function calculateDebtVsInvest(input: DebtVsInvestInputs) {
  const taxRate = input.taxRate ?? 0;
  const result = simulateDebtDecision(input, input.expectedReturn * (1 - taxRate / 100));
  let breakEvenReturn: number | null = null;
  for (let rate = 0; rate <= 20; rate += 0.1) {
    const scenario = simulateDebtDecision(input, Number(rate.toFixed(1)));
    if (scenario.investNetWorth >= scenario.repayNetWorth) {
      breakEvenReturn = Number(rate.toFixed(1));
      break;
    }
  }
  const difference = result.investNetWorth - result.repayNetWorth;
  const verdict =
    Math.abs(difference) <
    Math.max(
      Math.abs(result.repayNetWorth),
      Math.abs(result.investNetWorth),
      1,
    ) * 0.02
      ? "비슷함"
      : difference > 0
        ? "투자 우세"
        : "상환 우세";

  const scenarios = [
    { label: "부진", rate: input.pessimisticReturn ?? 0 },
    { label: "기준", rate: input.expectedReturn },
    { label: "호조", rate: input.optimisticReturn ?? input.expectedReturn },
  ].map((item) => {
    const simulated = simulateDebtDecision(input, item.rate * (1 - taxRate / 100));
    return { ...item, repay: simulated.repayNetWorth, invest: simulated.investNetWorth, difference: simulated.investNetWorth - simulated.repayNetWorth };
  });
  const requiredReserve = (input.fixedExpenses ?? 0) * (input.emergencyMonths ?? 0);
  const cashAfterRepay = (input.currentCash ?? input.prepaymentAmount) - input.prepaymentAmount - result.fee;
  const reserveGap = cashAfterRepay - requiredReserve;
  const cashMonthsAfterRepay = (input.fixedExpenses ?? 0) > 0 ? cashAfterRepay / input.fixedExpenses : 0;
  const downsideLoss = input.prepaymentAmount * ((input.maxLossRate ?? 0) / 100);
  const guaranteedReturn = input.loanRate;

  return {
    ...result,
    breakEvenReturn,
    difference,
    verdict,
    scenarios,
    requiredReserve,
    cashAfterRepay,
    reserveGap,
    cashMonthsAfterRepay,
    downsideLoss,
    guaranteedReturn,
  };
}

export function formatMoney(value: number) {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "−" : "";
  const absolute = Math.abs(rounded);
  if (absolute >= 100_000_000) {
    const eok = absolute / 100_000_000;
    return `${sign}${eok.toLocaleString("ko-KR", { maximumFractionDigits: eok >= 10 ? 1 : 2 })}억원`;
  }
  if (absolute >= 10_000) {
    return `${sign}${Math.round(absolute / 10_000).toLocaleString("ko-KR")}만원`;
  }
  return `${sign}${absolute.toLocaleString("ko-KR")}원`;
}

export function formatPeriod(months: number | null) {
  if (months === null) return "설정 기간 내 도달 어려움";
  if (months === 0) return "이미 달성";
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (!years) return `${rest}개월`;
  return rest ? `${years}년 ${rest}개월` : `${years}년`;
}

export function validateNumericInputs(values: Record<string, number>) {
  const entries = Object.entries(values);
  if (entries.some(([, value]) => !Number.isFinite(value))) return "모든 값을 숫자로 입력해 주세요.";
  if (entries.some(([, value]) => value < 0)) return "금액과 비율은 음수로 입력할 수 없습니다.";
  return null;
}
