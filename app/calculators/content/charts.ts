import { calculateCarCost, recurringFutureValue } from "../../lib/finance";
import { calculateRebalancing } from "../../lib/investment-management";
import { monthlyPayment } from "../../lib/home-purchase";
import type { GuideChart } from "../../guides/charts";

/**
 * 계산기 본문 차트.
 *
 * 계산기 안의 Recharts 그래프는 브라우저에서만 그려져 정적 HTML에 남지 않습니다.
 * 검색엔진과 자바스크립트를 끈 방문자에게도 그림이 보이도록,
 * 본문에는 서버에서 그린 SVG를 따로 둡니다.
 * 가이드 차트와 주제가 겹치지 않게 각 계산기마다 다른 각도를 잡았습니다.
 */

/** 같은 차를 몇 년 타느냐에 따라 총소유비용이 어떻게 달라지는지. */
const carAt = (holdingYears: number) => Math.round(calculateCarCost({
  carPrice: 35_000_000, downPayment: 15_000_000, tradeIn: 5_000_000,
  loanRate: 5.5, loanYears: 4, insuranceAnnual: 1_200_000, taxAnnual: 520_000,
  fuelMonthly: 180_000, parkingMonthly: 100_000, maintenanceAnnual: 600_000,
  resaleValue: 12_000_000, holdingYears, annualRate: 6,
  currentAssets: 50_000_000, monthlyInvestment: 1_300_000, targetAssets: 1_000_000_000,
}).totalOwnershipCost);

/** 만기를 늘리면 월 상환액은 줄지만 총이자는 늘어납니다. */
const totalInterest = (years: number) =>
  Math.round(monthlyPayment(560_000_000, 4, years) * years * 12 - 560_000_000);

/** 목표 비중에 정확히 맞출 때, 계좌 세율이 비용을 얼마나 바꾸는지. */
const exactCostAtTax = (taxRate: number) => Math.round((() => {
  const r = calculateRebalancing({
    assets: [
      { id: "eq", name: "주식 ETF", value: 76_000_000, target: 70, change: 0, taxRate, category: "ETF", leveraged: false, emergency: false },
      { id: "bond", name: "채권·현금", value: 24_000_000, target: 30, change: 0, taxRate: 0, category: "채권", leveraged: false, emergency: false },
    ],
    newMoney: 2_000_000, monthlyContribution: 2_000_000, threshold: 5,
    method: "exact", feeRate: 0.015, stressAssetId: "eq", stressDrop: 30, reviewMonths: 6,
  });
  return r.totalFee + r.totalTax;
})());

/** 하락한 가격이 원래대로 돌아오는 데 필요한 상승률. */
const recovery = (dropPercent: number) => Number((((1 / (1 - dropPercent / 100)) - 1) * 100).toFixed(1));

export const calculatorCharts: Record<string, GuideChart> = {
  "/calculators/goal-assets": {
    kind: "milestones",
    title: "월 130만원을 연 5.15%로 넣었을 때 원금과 수익의 비중",
    caption: "본문 예시와 같은 조건입니다. 15년이 지나도 자산의 절반 이상은 수익이 아니라 직접 넣은 돈입니다.",
    data: [5, 10, 15].map((year) => {
      const principal = 1_300_000 * 12 * year;
      const total = recurringFutureValue(1_300_000, 5.15, year * 12);
      return { label: `${year}년`, principal, profit: Math.max(total - principal, 0) };
    }),
  },
  "/calculators/rent-fire": {
    kind: "compare",
    title: "월 20만원을 줄였을 때, 투자 반영 비율만 바꾼 15년 결과",
    caption: "연 6%를 그대로 두고 반영 비율만 바꿨습니다. 이 계산기에서 가장 민감한 값은 수익률이 아니라 실제로 투자되는 비율입니다.",
    data: [
      { label: "전액 소비 (0%)", value: 0 },
      { label: "50% 투자", value: Math.round(recurringFutureValue(100_000, 6, 180)) },
      { label: "70% 투자", value: Math.round(recurringFutureValue(140_000, 6, 180)), emphasis: true },
      { label: "100% 투자", value: Math.round(recurringFutureValue(200_000, 6, 180)) },
    ],
    valueLabel: "15년 뒤 증가액",
  },
  "/calculators/job-offer": {
    kind: "compare",
    title: "세전 900만원 인상이 월 가처분소득으로 남기까지",
    caption: "본문 예시의 월 환산입니다. 세금과 직장 관련 비용을 지나면 처음 숫자의 3분의 1이 채 남지 않습니다.",
    data: [
      { label: "세후 현금 증가", value: 585_000 },
      { label: "통근비 증가", value: 150_000 },
      { label: "주거비 증가", value: 250_000 },
      { label: "실제 남는 금액", value: 185_000, emphasis: true },
    ],
    valueLabel: "월 금액",
  },
  "/calculators/car-cost": {
    kind: "compare",
    title: "같은 차를 몇 년 타느냐에 따른 총소유비용",
    caption: "다른 조건은 그대로 두고 보유기간만 바꿨습니다. 오래 탈수록 총액은 커지지만 1년당 비용은 줄어듭니다.",
    data: [
      { label: "5년 보유", value: carAt(5) },
      { label: "7년 보유", value: carAt(7), emphasis: true },
      { label: "10년 보유", value: carAt(10) },
    ],
    valueLabel: "총소유비용",
  },
  "/calculators/debt-vs-invest": {
    kind: "compare",
    title: "금리 4% 대출에서, 계좌 세율에 따라 달라지는 손익분기",
    caption: "같은 대출인데도 어떤 계좌에서 투자하느냐에 따라 넘어야 할 수익률이 달라집니다. 세율이 0이면 금리와 같아집니다.",
    data: [
      { label: "세율 0% (비과세)", value: 4 },
      { label: "세율 9.9%", value: Number((4 / (1 - 0.099)).toFixed(2)) },
      { label: "세율 15.4%", value: Number((4 / (1 - 0.154)).toFixed(2)), emphasis: true },
      { label: "세율 22%", value: Number((4 / (1 - 0.22)).toFixed(2)) },
    ],
    unit: "%",
    valueLabel: "필요 세전 수익률",
  },
  "/calculators/home-purchase": {
    kind: "compare",
    title: "5.6억원을 연 4%로 빌릴 때 만기별 총이자",
    caption: "만기를 늘리면 월 상환액이 줄어 대출 한도는 올라가지만, 갚는 동안 내는 이자는 함께 커집니다.",
    data: [
      { label: "10년 만기", value: totalInterest(10) },
      { label: "20년 만기", value: totalInterest(20) },
      { label: "30년 만기", value: totalInterest(30), emphasis: true },
      { label: "40년 만기", value: totalInterest(40) },
    ],
    valueLabel: "총이자",
  },
  "/calculators/lump-sum-vs-dca": {
    kind: "compare",
    title: "하락한 만큼 오르면 본전이 아닙니다",
    caption: "30% 떨어진 가격이 원래대로 돌아오려면 30%가 아니라 약 43%가 올라야 합니다. 급락 시나리오의 회복 개월 수가 길게 나오는 이유입니다.",
    data: [
      { label: "20% 하락 시", value: recovery(20) },
      { label: "30% 하락 시", value: recovery(30), emphasis: true },
      { label: "50% 하락 시", value: recovery(50) },
    ],
    unit: "%",
    valueLabel: "회복에 필요한 상승률",
  },
  "/calculators/rebalancing": {
    kind: "compare",
    title: "목표 비중에 정확히 맞출 때, 계좌 세율이 만드는 비용 차이",
    caption: "같은 매도인데 계좌에 따라 비용이 달라집니다. 매도가 필요할 때 어느 계좌에서 할지가 방법 선택만큼 중요합니다.",
    data: [
      { label: "세율 0%", value: exactCostAtTax(0) },
      { label: "세율 15.4%", value: exactCostAtTax(15.4), emphasis: true },
      { label: "세율 22%", value: exactCostAtTax(22) },
    ],
    valueLabel: "수수료+세금",
  },
  "/tools/growth-board": {
    kind: "compare",
    title: "월 10만원을 남기는 두 가지 경로",
    caption: "절약은 세금을 거치지 않지만 소득은 거칩니다. 세후 반영률 75%를 가정하면 같은 10만원을 남기는 데 필요한 세전 금액이 다릅니다.",
    data: [
      { label: "절약으로 10만원", value: 100_000, emphasis: true },
      { label: "소득 인상으로 10만원", value: Math.round(100_000 / 0.75) },
    ],
    valueLabel: "필요한 세전 금액",
  },
};
