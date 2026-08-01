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
  const currentCashCompensation = input.currentBase +
    input.currentBonus * (input.currentBonusProbability / 100) +
    (input.currentCashAllowance ?? 0);
  const offerCashCompensation = input.offerBase +
    input.offerBonus * (input.offerBonusProbability / 100) +
    (input.offerCashAllowance ?? 0);
  const currentBenefits = (input.currentWelfarePoints ?? 0) + (input.currentMealBenefit ?? 0) + (input.currentTransportBenefit ?? 0) + (input.currentHousingBenefit ?? 0);
  const offerBenefits = (input.offerWelfarePoints ?? 0) + (input.offerMealBenefit ?? 0) + (input.offerTransportBenefit ?? 0) + (input.offerHousingBenefit ?? 0);
  const expectedEquity = (input.offerEquityAnnual ?? 0) * ((input.offerEquityProbability ?? 0) / 100);
  const currentExpected = currentCashCompensation + currentBenefits;
  const offerExpected = offerCashCompensation + offerBenefits + expectedEquity;
  const baseDifference = input.offerBase - input.currentBase;
  const baseIncreaseRate = input.currentBase
    ? (baseDifference / input.currentBase) * 100
    : 0;
  const expectedDifference = offerExpected - currentExpected;
  const afterTaxCashDifference = (offerCashCompensation - currentCashCompensation) * (input.afterTaxRate / 100);
  const spendableBenefitDifference = offerBenefits - currentBenefits;
  const monthlyCostDifference =
    input.offerCommute - input.currentCommute +
    (input.offerHousing - input.currentHousing) +
    (input.offerOther - input.currentOther);
  // Equity is intentionally excluded: a probability-weighted paper value is not
  // spendable cash. Benefits are already entered as the user's usable value.
  const monthlyDisposableIncrease = (afterTaxCashDifference + spendableBenefitDifference) / 12 - monthlyCostDifference;
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
  const qualitativeAverage = (input.careerExpansion + input.rejobPotential + input.stability) / 3;
  const cashFlowTolerance = 1_000;
  const verdict = monthlyDisposableIncrease > cashFlowTolerance
    ? "월 현금흐름 증가"
    : monthlyDisposableIncrease < -cashFlowTolerance
      ? "월 현금흐름 감소"
      : "월 현금흐름 유사";

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
    verdict,
    currentCashCompensation,
    offerCashCompensation,
    afterTaxCashDifference,
    spendableBenefitDifference,
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
  const contributionRate = monthlyInvestment > 0
    ? enabled.reduce((sum, asset) => sum + (asset.monthlyContribution + (asset.monthlyIncome ?? 0)) * asset.annualRate, 0) / monthlyInvestment
    : currentAssets > 0
      ? weightedRate
      : enabled.length
        ? enabled.reduce((sum, asset) => sum + asset.annualRate, 0) / enabled.length
        : 0;
  const valueAt = (months: number, rateShift = 0) => enabled.reduce((sum, asset) => sum + futureValue(
    asset.currentValue,
    asset.monthlyContribution + (asset.monthlyIncome ?? 0),
    Math.max(asset.annualRate + rateShift, -99.9),
    months,
  ), 0);
  const projectedAtTarget = valueAt(targetMonths);
  let currentMonths: number | null = currentAssets >= input.targetAssets ? 0 : null;
  for (let month = 1; currentMonths === null && month <= DEFAULT_MAX_MONTHS; month += 1) if (valueAt(month) >= input.targetAssets) currentMonths = month;
  const additionalMonthlyInvestment = requiredMonthlyContribution(
    0,
    Math.max(input.targetAssets - projectedAtTarget, 0),
    contributionRate,
    targetMonths,
  );
  const requiredMonthlyInvestment = monthlyInvestment + additionalMonthlyInvestment;
  const monthlyGap = additionalMonthlyInvestment;
  const assetGap = Math.max(input.targetAssets - projectedAtTarget, 0);
  const onTrack = projectedAtTarget >= input.targetAssets;
  const scenarios = [-2, 0, 2].map((shift) => {
    let months: number | null = currentAssets >= input.targetAssets ? 0 : null;
    for (let month = 1; months === null && month <= DEFAULT_MAX_MONTHS; month += 1) {
      if (valueAt(month, shift) >= input.targetAssets) months = month;
    }
    return {
      rate: contributionRate + shift,
      rateShift: shift,
      value: valueAt(targetMonths, shift),
      months,
    };
  });
  const chart = Array.from({ length: Math.max(Math.floor(input.targetYears), 0) + 1 }, (_, year) => ({
    year,
    current: valueAt(year * 12),
    required: valueAt(year * 12) + recurringFutureValue(
      additionalMonthlyInvestment,
      contributionRate,
      year * 12,
    ),
  }));
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
    contributionRate,
    additionalMonthlyInvestment,
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
  residualLoanBalance: number,
) {
  let assets = input.currentAssets - upfrontCash;
  const rate = monthlyRate(input.annualRate);
  const holdingMonths = input.holdingYears * 12;
  const loanMonths = input.loanYears * 12;
  if (assets >= input.targetAssets) return 0;
  for (let month = 1; month <= DEFAULT_MAX_MONTHS; month += 1) {
    if (assets > 0) assets *= 1 + rate;
    let availableInvestment = input.monthlyInvestment;
    if (month <= holdingMonths) availableInvestment -= operatingMonthly;
    if (month <= Math.min(loanMonths, holdingMonths)) availableInvestment -= loanPayment;
    assets += availableInvestment;
    if (month === holdingMonths) assets += input.resaleValue - residualLoanBalance;
    if (assets >= input.targetAssets) return month;
  }
  return null;
}

function remainingLoanBalance(principal: number, annualRatePercent: number, totalMonths: number, paidMonths: number) {
  if (principal <= 0 || totalMonths <= 0 || paidMonths >= totalMonths) return 0;
  const payment = monthlyLoanPayment(principal, annualRatePercent, totalMonths);
  if (annualRatePercent === 0) return Math.max(principal - payment * paidMonths, 0);
  const rate = annualRatePercent / 100 / 12;
  return Math.max(
    principal * Math.pow(1 + rate, paidMonths) - payment * ((Math.pow(1 + rate, paidMonths) - 1) / rate),
    0,
  );
}

export function calculateCarCost(input: CarCostInputs) {
  const upfrontCash = Math.min(Math.max(input.downPayment, 0), input.carPrice);
  const tradeInApplied = Math.min(Math.max(input.tradeIn, 0), Math.max(input.carPrice - upfrontCash, 0));
  const financedPrincipal = Math.max(input.carPrice - upfrontCash - tradeInApplied, 0);
  const loanMonths = input.loanYears * 12;
  const holdingMonths = input.holdingYears * 12;
  const loanPayment = monthlyLoanPayment(
    financedPrincipal,
    input.loanRate,
    loanMonths,
  );
  const paidLoanMonths = Math.min(loanMonths, holdingMonths);
  const residualLoanBalance = remainingLoanBalance(financedPrincipal, input.loanRate, loanMonths, paidLoanMonths);
  const loanPaymentsDuringHolding = loanPayment * paidLoanMonths;
  const principalRepaidDuringHolding = financedPrincipal - residualLoanBalance;
  const loanInterest = Math.max(loanPaymentsDuringHolding - principalRepaidDuringHolding, 0);
  const operatingMonthly =
    input.fuelMonthly +
    input.parkingMonthly +
    (input.insuranceAnnual + input.taxAnnual + input.maintenanceAnnual) / 12;
  const runningCostFirstMonth = loanPayment + operatingMonthly;
  const operatingTotal = operatingMonthly * holdingMonths;
  const totalOwnershipCost = Math.max(
    upfrontCash + tradeInApplied + loanPaymentsDuringHolding + residualLoanBalance + operatingTotal - input.resaleValue,
    0,
  );

  const investmentRate = monthlyRate(input.annualRate);
  const horizonMonths = holdingMonths;
  let opportunityCost15 = (upfrontCash + tradeInApplied) * Math.pow(1 + investmentRate, horizonMonths);
  for (let month = 1; month <= holdingMonths; month += 1) {
    const monthlyCost = operatingMonthly + (month <= loanMonths ? loanPayment : 0);
    opportunityCost15 +=
      monthlyCost * Math.pow(1 + investmentRate, horizonMonths - month);
  }
  opportunityCost15 += (residualLoanBalance - input.resaleValue) *
    Math.pow(1 + investmentRate, horizonMonths - holdingMonths);
  opportunityCost15 = Math.max(opportunityCost15, 0);

  const baselineMonths = monthsToTarget(
    input.currentAssets + tradeInApplied,
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
    residualLoanBalance,
  );
  const delayedMonths =
    baselineMonths !== null && carMonths !== null
      ? Math.max(carMonths - baselineMonths, 0)
      : null;
  const costBreakdown = [
    { name: "차량 순구매비", value: Math.max(input.carPrice - input.resaleValue, 0) },
    { name: "할부이자", value: loanInterest },
    { name: "보험·세금·정비", value: ((input.insuranceAnnual + input.taxAnnual + input.maintenanceAnnual) / 12) * holdingMonths },
    { name: "유류·주차", value: (input.fuelMonthly + input.parkingMonthly) * holdingMonths },
  ];

  return {
    upfrontCash,
    tradeInApplied,
    financedPrincipal,
    loanPayment,
    loanInterest,
    residualLoanBalance,
    loanPaymentsDuringHolding,
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
  const sharedCash = Number.isFinite(input.currentCash)
    ? Math.max(input.currentCash - prepayment - fee, 0)
    : 0;
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
    {
      year: 0,
      repay: sharedCash + repayAssets - repayDebt,
      invest: sharedCash + investAssets - investDebt,
    },
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
      const unusedBudget = scheduledPayment - payment;
      investAssets += input.monthlyExtra + Math.max(unusedBudget, 0);
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
        repay: sharedCash + repayAssets - repayDebt,
        invest: sharedCash + investAssets - investDebt,
      });
    }
  }

  return {
    fee,
    scheduledPayment,
    repayNetWorth: sharedCash + repayAssets - repayDebt,
    investNetWorth: sharedCash + investAssets - investDebt,
    repayInterest,
    investInterest,
    interestSaved: Math.max(investInterest - repayInterest, 0),
    repayPayoffMonth,
    investPayoffMonth,
    chart,
  };
}

export function calculateDebtVsInvest(input: DebtVsInvestInputs) {
  const taxRate = Math.min(Math.max(input.taxRate ?? 0, 0), 100);
  const requiredReserve = Math.max(input.fixedExpenses ?? 0, 0) * Math.max(input.emergencyMonths ?? 0, 0);
  const requestedPrepayment = Math.min(Math.max(input.prepaymentAmount, 0), input.loanBalance);
  const feeRate = Math.max(input.prepaymentFeeRate, 0) / 100;
  const hasCashInput = Number.isFinite(input.currentCash);
  const affordablePrepayment = hasCashInput
    ? Math.max((input.currentCash - requiredReserve) / (1 + feeRate), 0)
    : requestedPrepayment;
  const actualPrepayment = Math.min(requestedPrepayment, affordablePrepayment);
  const scheduledPayment = monthlyLoanPayment(input.loanBalance, input.loanRate, input.remainingYears * 12);
  const hasCashFlowInput = Number.isFinite(input.monthlyIncome) && Number.isFinite(input.fixedExpenses);
  const affordableMonthlyExtra = hasCashFlowInput
    ? Math.max(input.monthlyIncome - input.fixedExpenses - scheduledPayment, 0)
    : Math.max(input.monthlyExtra, 0);
  const actualMonthlyExtra = Math.min(Math.max(input.monthlyExtra, 0), affordableMonthlyExtra);
  const adjustedInput = { ...input, prepaymentAmount: actualPrepayment, monthlyExtra: actualMonthlyExtra };
  const afterTaxReturn = (grossRate: number) => grossRate > 0 ? grossRate * (1 - taxRate / 100) : grossRate;
  const result = simulateDebtDecision(adjustedInput, afterTaxReturn(input.expectedReturn));
  let breakEvenReturn: number | null = null;
  for (let rate = 0; rate <= 100; rate += 0.1) {
    const scenario = simulateDebtDecision(adjustedInput, afterTaxReturn(Number(rate.toFixed(1))));
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
      ? "두 시나리오 순자산 유사"
      : difference > 0
        ? "투자 시나리오 순자산 높음"
        : "상환 시나리오 순자산 높음";

  const scenarios = [
    { label: "부진", rate: input.pessimisticReturn ?? 0 },
    { label: "기준", rate: input.expectedReturn },
    { label: "호조", rate: input.optimisticReturn ?? input.expectedReturn },
  ].map((item) => {
    const simulated = simulateDebtDecision(adjustedInput, afterTaxReturn(item.rate));
    return { ...item, repay: simulated.repayNetWorth, invest: simulated.investNetWorth, difference: simulated.investNetWorth - simulated.repayNetWorth };
  });
  const startingCash = hasCashInput ? input.currentCash : actualPrepayment + result.fee;
  const cashAfterRepay = startingCash - actualPrepayment - result.fee;
  const reserveGap = cashAfterRepay - requiredReserve;
  const cashMonthsAfterRepay = (input.fixedExpenses ?? 0) > 0 ? cashAfterRepay / input.fixedExpenses : 0;
  const downsideLoss = (actualPrepayment + result.fee) * ((input.maxLossRate ?? 0) / 100);
  const netRepaymentBenefit = result.interestSaved - result.fee;

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
    nominalLoanRate: input.loanRate,
    netRepaymentBenefit,
    actualPrepayment,
    prepaymentLimited: actualPrepayment + 0.01 < requestedPrepayment,
    affordablePrepayment,
    actualMonthlyExtra,
    monthlyExtraLimited: actualMonthlyExtra + 0.01 < input.monthlyExtra,
    affordableMonthlyExtra,
    afterTaxExpectedReturn: afterTaxReturn(input.expectedReturn),
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
