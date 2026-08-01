import { monthlyRate } from "./finance";

export type DcaInputs = { amount:number; waitingCash:number; dcaMonths:number; annualReturn:number; cashRate:number; dropPercent:number; dropMonth:number; years:number; essentialExpenses:number; emergencyMonths:number; plannedCashUse:number; stressTolerance:number };
type MarketScenario = { key:string; label:string; shockMonth:number | null };

function simulateStrategy(input:DcaInputs, shockMonth:number|null, lump:boolean) {
  const months = Math.max(input.years * 12, 0);
  const growth = 1 + monthlyRate(input.annualReturn);
  const cashGrowth = 1 + monthlyRate(input.cashRate);
  const dcaMonths = Math.max(Math.floor(input.dcaMonths), 1);
  let price = 1;
  let units = lump ? input.amount : 0;
  let cash = lump ? 0 : input.amount;
  let interest = 0;
  let maxLoss = 0;
  const tranche = input.amount / dcaMonths;

  for (let month = 1; month <= months; month += 1) {
    price *= growth;
    if (shockMonth === month) price *= 1 - input.dropPercent / 100;
    if (!lump && month <= dcaMonths) {
      const cashBeforeInterest = cash;
      cash *= cashGrowth;
      interest += cash - cashBeforeInterest;
      const buy = Math.min(tranche, cash);
      units += price > 0 ? buy / price : 0;
      cash -= buy;
    } else if (!lump && cash > 0) {
      const cashBeforeInterest = cash;
      cash *= cashGrowth;
      interest += cash - cashBeforeInterest;
    }
    const value = units * price + cash;
    maxLoss = Math.max(maxLoss, Math.max(input.amount - value, 0));
  }
  return { value:units * price + cash, interest, maxLoss, endingPrice:price };
}

export function calculateDcaComparison(input:DcaInputs) {
  const scenarios:MarketScenario[] = [
    { key:"growth", label:"상승 지속", shockMonth:null },
    { key:"immediate", label:"투자 직후 급락", shockMonth:1 },
    { key:"middle", label:"중간 급락 후 회복", shockMonth:Math.min(Math.max(input.dropMonth, 2), input.years * 12) },
  ];
  const results = scenarios.map((scenario) => {
    const lump = simulateStrategy(input, scenario.shockMonth, true);
    const dca = simulateStrategy(input, scenario.shockMonth, false);
    return { ...scenario, lump, dca, difference:lump.value - dca.value };
  });
  const growth = results[0];
  const opportunityCost = Math.max(growth.lump.value - growth.dca.value, 0);
  const reserve = input.waitingCash - input.plannedCashUse;
  const requiredReserve = input.essentialExpenses * input.emergencyMonths;
  const recoveryMonths = input.dropPercent <= 0
    ? 0
    : input.dropPercent >= 100 || input.annualReturn <= 0
      ? null
      : Math.ceil(Math.log(1 / (1 - input.dropPercent / 100)) / Math.log(1 + monthlyRate(input.annualReturn)));
  const breakEvenAnnual = input.cashRate;
  const comparisonTolerance = Math.max(input.amount * 0.001, 1);
  const marketComparison = Math.abs(growth.difference) <= comparisonTolerance
    ? "상승 지속 가정에서 종료금액 유사"
    : growth.difference > 0
      ? "상승 지속 가정에서 일시투자 종료금액이 큼"
      : "상승 지속 가정에서 분할매수 종료금액이 큼";
  const safetyStatus = input.plannedCashUse > input.waitingCash
    ? "예정 지출 재원 부족"
    : reserve < requiredReserve
      ? "비상자금 목표 미달"
      : "비상자금 목표 충족";
  const verdict = `${safetyStatus} · ${marketComparison}`;
  const stressNote = input.stressTolerance <= 2
    ? "입력한 손실 감내도가 낮습니다. 급락 시나리오의 평가손실을 별도로 확인하세요."
    : input.stressTolerance >= 4
      ? "입력한 손실 감내도는 높지만 실제 급락 때의 매도 가능성은 계산할 수 없습니다."
      : "손실 감내도는 자기평가이므로 급락 시 필요한 현금과 행동계획을 함께 확인하세요.";

  return {
    results,
    opportunityCost,
    reserve,
    requiredReserve,
    recoveryMonths,
    breakEvenAnnual,
    verdict,
    safetyStatus,
    marketComparison,
    stressNote,
    monthlyTranche:input.amount / Math.max(input.dcaMonths, 1),
  };
}

export type RebalanceAsset={id:string;name:string;value:number;target:number;change:number;taxRate:number;category:string;leveraged:boolean;emergency:boolean};
export type RebalanceInputs={assets:RebalanceAsset[];newMoney:number;monthlyContribution:number;threshold:number;method:"new"|"exact"|"partial";feeRate:number;stressAssetId:string;stressDrop:number;reviewMonths:number};

export function calculateRebalancing(input:RebalanceInputs) {
  const simulated = input.assets.map((asset) => ({ ...asset, simulatedValue:Math.max(asset.value * (1 + asset.change / 100), 0) }));
  const currentTotal = simulated.reduce((sum, asset) => sum + asset.simulatedValue, 0);
  const finalTotal = currentTotal + Math.max(input.newMoney, 0);
  const targetSum = simulated.reduce((sum, asset) => sum + asset.target, 0);
  const targetValid = simulated.length > 0 && Math.abs(targetSum - 100) <= 0.01;
  const current = simulated.map((asset) => {
    const currentWeight = currentTotal ? asset.simulatedValue / currentTotal * 100 : 0;
    const targetAmount = targetValid ? finalTotal * asset.target / 100 : asset.simulatedValue;
    return { ...asset, currentWeight, deviation:currentWeight - asset.target, targetAmount, exactAdjustment:targetAmount - asset.simulatedValue };
  });
  const deficits = current.map((asset) => Math.max(asset.exactAdjustment, 0));
  const deficitSum = deficits.reduce((sum, value) => sum + value, 0);
  const newAllocRaw = current.map((asset, index) => !targetValid
    ? 0
    : deficitSum > 0
      ? Math.max(input.newMoney, 0) * deficits[index] / deficitSum
      : Math.max(input.newMoney, 0) * asset.target / 100);
  const partialRaw = current.map((asset) => {
    if (!targetValid) return 0;
    const lower = Math.max(asset.target - input.threshold, 0) / 100 * finalTotal;
    const upper = Math.min(asset.target + input.threshold, 100) / 100 * finalTotal;
    if (asset.simulatedValue < lower) return lower - asset.simulatedValue;
    if (asset.simulatedValue > upper) return upper - asset.simulatedValue;
    return 0;
  });
  const feeRate = Math.max(input.feeRate, 0) / 100;
  const newMoney = Math.max(input.newMoney, 0);
  const newAllocRawTotal = newAllocRaw.reduce((sum, value) => sum + Math.max(value, 0), 0);
  const newAllocationBudget = newMoney / (1 + feeRate);
  const newAllocScale = newAllocRawTotal > 0 ? Math.min(newAllocationBudget / newAllocRawTotal, 1) : 0;
  const newAlloc = newAllocRaw.map(value => value * newAllocScale);
  const rawAdjustments = current.map((asset, index) => {
    if (!targetValid) return 0;
    if (input.method === "exact") return asset.exactAdjustment;
    if (input.method === "new") return newAlloc[index];
    return partialRaw[index];
  });
  const sellDeductions = current.reduce((sum, asset, index) => {
    const sell = Math.max(-rawAdjustments[index], 0);
    const saleCostRate = feeRate + Math.min(Math.max(asset.taxRate, 0), 100) / 100;
    return sum + sell * saleCostRate;
  }, 0);
  const sellProceeds = rawAdjustments.reduce((sum, value) => sum + Math.max(-value, 0), 0);
  const netSellProceeds = Math.max(sellProceeds - sellDeductions, 0);
  const rawBuyTotal = rawAdjustments.reduce((sum, value) => sum + Math.max(value, 0), 0);
  const buyBudget = (newMoney + netSellProceeds) / (1 + feeRate);
  const buyScale = rawBuyTotal > 0 ? Math.min(buyBudget / rawBuyTotal, 1) : 0;
  const preliminary = current.map((asset, index) => {
    const raw = rawAdjustments[index];
    const adjustment = raw > 0 ? raw * buyScale : raw;
    return { asset, index, adjustment, postValue:Math.max(asset.simulatedValue + adjustment, 0) };
  });
  const buyGross = preliminary.reduce((sum, row) => sum + Math.max(row.adjustment, 0), 0);
  const saleGross = preliminary.reduce((sum, row) => sum + Math.max(-row.adjustment, 0), 0);
  const preliminaryFees = preliminary.reduce((sum, row) => sum + Math.abs(row.adjustment) * feeRate, 0);
  const preliminaryTaxes = preliminary.reduce((sum, row) => sum + (row.adjustment < 0 ? Math.abs(row.adjustment) * Math.min(Math.max(row.asset.taxRate, 0), 100) / 100 : 0), 0);
  const unallocatedCash = Math.max(newMoney + saleGross - preliminaryFees - preliminaryTaxes - buyGross, 0);
  const postHoldingsTotal = preliminary.reduce((sum, row) => sum + row.postValue, 0);
  const postPortfolioTotal = postHoldingsTotal + unallocatedCash;
  const rows = preliminary.map(({ asset, index, adjustment, postValue }) => {
    const fee = Math.abs(adjustment) * input.feeRate / 100;
    // taxRate is deliberately a user-provided sale-proceeds cost rate. Without
    // cost basis, a capital-gains tax cannot be calculated honestly.
    const tax = adjustment < 0 ? Math.abs(adjustment) * asset.taxRate / 100 : 0;
    return {
      ...asset,
      newAllocation:newAlloc[index],
      adjustment,
      postValue,
      postWeight:postPortfolioTotal ? postValue / postPortfolioTotal * 100 : 0,
      fee,
      tax,
      action:adjustment > 1 ? "매수" : adjustment < -1 ? "매도" : "유지",
    };
  });
  const over = [...current].sort((a, b) => b.deviation - a.deviation)[0];
  const under = [...current].sort((a, b) => a.deviation - b.deviation)[0];
  const maxDeviation = Math.max(...current.map((asset) => Math.abs(asset.deviation)), 0);
  const relativeMax = Math.max(...current.map((asset) => asset.target ? Math.abs(asset.deviation) / asset.target * 100 : 0), 0);
  const status = !targetValid
    ? "목표 비중 합계 확인 필요"
    : maxDeviation <= input.threshold
      ? "사용자 허용범위 안"
      : "사용자 허용범위 밖";
  const requiredNewMoney = !targetValid ? 0 : Math.max(
    ...current
      .filter((asset) => asset.deviation > input.threshold && asset.target + input.threshold > 0)
      .map((asset) => asset.simulatedValue / ((asset.target + input.threshold) / 100) - currentTotal),
    0,
  );
  const returnMonths = input.monthlyContribution > 0 ? Math.ceil(requiredNewMoney / input.monthlyContribution) : null;
  const totalFee = rows.reduce((sum, asset) => sum + asset.fee, 0);
  const totalTax = rows.reduce((sum, asset) => sum + asset.tax, 0);
  const shockAsset = simulated.find((asset) => asset.id === input.stressAssetId);
  const stressLoss = shockAsset && currentTotal ? shockAsset.simulatedValue * input.stressDrop / 100 : 0;
  const stressPortfolioRate = currentTotal ? stressLoss / currentTotal * 100 : 0;
  const risks:string[] = [];
  if (current.some((asset) => asset.currentWeight > 50 && asset.category !== "현금")) risks.push("단일 위험자산 50% 초과");
  if (current.filter((asset) => asset.category === "암호화폐").reduce((sum, asset) => sum + asset.currentWeight, 0) > 50) risks.push("암호화폐 비중 50% 초과");
  if (current.some((asset) => asset.category === "개별주식" && asset.currentWeight > 10)) risks.push("개별주식 한 종목 10% 초과");
  if (current.some((asset) => asset.leveraged)) risks.push("레버리지 자산 포함");
  if (current.some((asset) => asset.emergency)) risks.push("비상자금이 투자자산에 포함됨");
  const partialSellProceeds = input.method === "partial" ? saleGross : 0;
  const partialBuyBudget = input.method === "partial" ? buyBudget : 0;

  return { rows, currentTotal, finalTotal, targetSum, targetValid, canExecute:targetValid, over, under, maxDeviation, relativeMax, status, requiredNewMoney, returnMonths, totalFee, totalTax, stressLoss, stressPortfolioRate, risks, partialSellProceeds, partialBuyBudget, unallocatedCash };
}
