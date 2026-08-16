import { calculateCarCost, recurringFutureValue } from "../lib/finance";
import { calculateRebalancing } from "../lib/investment-management";
import { maximumBrokerFee, standardAcquisitionTaxRate } from "../lib/home-purchase";
import type { CompareItem, MilestonePoint } from "../components/charts/Charts";

/**
 * 가이드 본문 차트의 데이터.
 *
 * 값을 손으로 적어 두지 않고 계산기와 같은 함수로 산출합니다.
 * 공식을 고치면 차트도 함께 따라오도록 하기 위해서입니다.
 */

export type GuideChart =
  | { kind: "milestones"; title: string; caption: string; data: MilestonePoint[]; principalLabel?: string; profitLabel?: string }
  | { kind: "compare"; title: string; caption: string; data: CompareItem[]; unit?: string; valueLabel?: string };

/** 매월 같은 금액을 넣었을 때의 납입 원금과 복리 수익을 시점별로 나눕니다. */
function milestones(monthly: number, annualRate: number, years: number[]): MilestonePoint[] {
  return years.map((year) => {
    const principal = monthly * 12 * year;
    const total = recurringFutureValue(monthly, annualRate, year * 12);
    return { label: `${year}년`, principal, profit: Math.max(total - principal, 0) };
  });
}

/** 세후 목표 수익률을 만들기 위해 필요한 세전 수익률. */
function requiredGross(netRate: number, taxRate: number) {
  return Number((netRate / (1 - taxRate / 100)).toFixed(2));
}

// 자동차 총소유비용 구성 — 계산기 빠른 계산 기본값과 같은 조건입니다.
const carResult = calculateCarCost({
  carPrice: 35_000_000, downPayment: 15_000_000, tradeIn: 5_000_000,
  loanRate: 5.5, loanYears: 4, insuranceAnnual: 1_200_000, taxAnnual: 520_000,
  fuelMonthly: 180_000, parkingMonthly: 100_000, maintenanceAnnual: 600_000,
  resaleValue: 12_000_000, holdingYears: 7, annualRate: 6,
  currentAssets: 50_000_000, monthlyInvestment: 1_300_000, targetAssets: 1_000_000_000,
});

// 리밸런싱 실행안별로 이번 회차에 실제로 나가는 수수료와 세금.
const rebalancePortfolio = [
  { id: "eq", name: "주식 ETF", value: 76_000_000, target: 70, change: 0, taxRate: 15.4, category: "ETF", leveraged: false, emergency: false },
  { id: "bond", name: "채권·현금", value: 24_000_000, target: 30, change: 0, taxRate: 0, category: "채권", leveraged: false, emergency: false },
];
const rebalanceCost = (method: "new" | "exact" | "partial") => {
  const r = calculateRebalancing({
    assets: rebalancePortfolio, newMoney: 2_000_000, monthlyContribution: 2_000_000,
    threshold: 5, method, feeRate: 0.015, stressAssetId: "eq", stressDrop: 30, reviewMonths: 6,
  });
  return Math.round(r.totalFee + r.totalTax);
};

// 8억원 주택의 계산 가능한 부대비용. 법무·채권·이사비는 견적 전 값이라 제외했습니다.
const HOME_PRICE = 800_000_000;
const acquisitionTax = HOME_PRICE * standardAcquisitionTaxRate(HOME_PRICE) / 100;

export const guideCharts: Record<string, GuideChart> = {
  "rent-100k-15years": {
    kind: "milestones",
    title: "월 10만원을 연 4%로 계속 넣었을 때",
    caption: "막대의 아래 칸이 실제로 넣은 돈, 위 칸이 복리로 붙은 부분입니다. 15년이 지나도 대부분은 여전히 원금입니다.",
    data: milestones(100_000, 4, [5, 10, 15]),
  },
  "rent-saving-gap": {
    kind: "compare",
    title: "월세는 20만원 줄었는데 남은 돈은 5만원인 경우",
    caption: "절감액이 아니라 새 지출을 뺀 뒤의 금액이 실제 투자 원금입니다. 자산 계산에는 강조된 값을 넣어야 합니다.",
    data: [
      { label: "월세 절감액", value: 200_000 },
      { label: "새로 늘어난 지출", value: 150_000 },
      { label: "실제 남은 여유", value: 50_000, emphasis: true },
    ],
    valueLabel: "월 금액",
  },
  "base-vs-bonus": {
    kind: "compare",
    title: "확정 보상과 기대 보상을 나눠 본 첫해 연간 보상",
    caption: "A사는 기본급 6,000만원에 목표 성과급 1,000만원, B사는 기본급 6,400만원에 보장 보너스 400만원인 가상 제안입니다.",
    data: [
      { label: "A사 · 성과급 미지급", value: 60_000_000 },
      { label: "A사 · 지급 가능성 50%", value: 65_000_000 },
      { label: "B사 · 첫해 확정", value: 68_000_000, emphasis: true },
      { label: "A사 · 목표 전액 지급", value: 70_000_000 },
    ],
    valueLabel: "연간 보상",
  },
  "bonus-probability": {
    kind: "compare",
    title: "목표 성과급 1,200만원에 지급 가능성을 곱하면",
    caption: "기대값은 비교용 숫자입니다. 실제 결과는 0원이거나 목표액이거나 둘 중 하나에 가깝습니다.",
    data: [
      { label: "가능성 0%", value: 0 },
      { label: "가능성 40%", value: 4_800_000 },
      { label: "가능성 60%", value: 7_200_000, emphasis: true },
      { label: "가능성 100%", value: 12_000_000 },
    ],
    valueLabel: "기대 성과급",
  },
  "salary-10m": {
    kind: "milestones",
    title: "연봉 1,000만원 인상분 중 월 37.5만원을 투자하면",
    caption: "세후 반영률 75%, 그중 투자 비율 60%, 연 4%를 가정했습니다. 인상분 전액이 아니라 실제로 남는 금액 기준입니다.",
    data: milestones(375_000, 4, [5, 10, 15]),
  },
  "commute-cost": {
    kind: "compare",
    title: "통근 40분이 늘었을 때 성격이 다른 두 숫자",
    caption: "왼쪽만 실제로 결제되는 돈입니다. 시간 비교값은 삶의 질을 견주기 위한 점수이지 매달 빠져나가는 금액이 아닙니다.",
    data: [
      { label: "실제 현금 지출 증가", value: 80_000, emphasis: true },
      { label: "시간 비교값 (환산)", value: 200_000 },
    ],
    valueLabel: "월 금액",
  },
  "monthly-130-vs-250": {
    kind: "milestones",
    title: "월 투자금 차액 120만원만 따로 떼어 보면",
    caption: "월 130만원과 250만원의 차이인 120만원을 연 6%로 넣었을 때입니다. 수익률이 아니라 납입액이 만든 차이입니다.",
    data: milestones(1_200_000, 6, [5, 10, 15]),
  },
  "startup-stock-options": {
    kind: "compare",
    title: "연 2,000만원으로 제시된 주식보상의 실현 가능성별 가치",
    caption: "상장, 베스팅, 퇴사 조건 중 하나만 어긋나도 왼쪽 끝으로 이동합니다. 생활비 계획은 이 칸을 뺀 현금으로 세워야 합니다.",
    data: [
      { label: "미실현 (0%)", value: 0, emphasis: true },
      { label: "일부 실현 (25%)", value: 5_000_000 },
      { label: "절반 실현 (50%)", value: 10_000_000 },
      { label: "전액 실현 (100%)", value: 20_000_000 },
    ],
    valueLabel: "연 환산 가치",
  },
  "lower-return-assumption": {
    kind: "compare",
    title: "월 130만원 15년, 수익률 가정만 바꿨을 때",
    caption: "납입액과 기간은 그대로 두고 수익률 가정만 바꾼 결과입니다. 계획이 이 폭 안에서 흔들린다면 가정에 기대고 있는 것입니다.",
    data: [
      { label: "연 0%", value: Math.round(recurringFutureValue(1_300_000, 0, 180)) },
      { label: "연 4%", value: Math.round(recurringFutureValue(1_300_000, 4, 180)), emphasis: true },
      { label: "연 6%", value: Math.round(recurringFutureValue(1_300_000, 6, 180)) },
      { label: "연 8%", value: Math.round(recurringFutureValue(1_300_000, 8, 180)) },
    ],
    valueLabel: "15년 뒤 예상액",
  },
  "lifestyle-inflation": {
    kind: "compare",
    title: "세후 월 62.5만원이 늘었을 때, 투자 비율별 15년 결과",
    caption: "연봉 1,000만원 인상의 세후 월 증가액을 62.5만원으로 두고 연 4%를 적용했습니다. 인상 폭이 아니라 배분 비율이 결과를 만듭니다.",
    data: [
      { label: "전액 소비 (0%)", value: 0 },
      { label: "30% 투자", value: Math.round(recurringFutureValue(625_000 * 0.3, 4, 180)) },
      { label: "50% 투자", value: Math.round(recurringFutureValue(625_000 * 0.5, 4, 180)), emphasis: true },
      { label: "100% 투자", value: Math.round(recurringFutureValue(625_000, 4, 180)) },
    ],
    valueLabel: "15년 뒤 예상액",
  },
  "car-total-cost": {
    kind: "compare",
    title: "3,500만원 차량을 7년 보유할 때 비용이 나가는 곳",
    caption: "계산기의 빠른 계산 기본값과 같은 조건입니다. 차량 순구매비는 이미 예상 중고차 가치를 뺀 금액이며, 그보다 유류·주차 누적이 더 큽니다.",
    // 항목에 순서가 없으므로 모든 막대가 같은 색을 씁니다.
    // 특정 항목을 강조하면 길이로 이미 보이는 크기 관계를 색으로 다시 말하게 됩니다.
    data: carResult.costBreakdown.map((item) => ({
      label: item.name,
      value: Math.round(item.value),
    })),
    valueLabel: "7년 누적",
  },
  "debt-repayment-vs-investing": {
    kind: "compare",
    title: "대출 금리와 같은 효과를 내려면 필요한 세전 수익률",
    caption: "투자 수익에는 세금이 붙지만 이자 절감에는 붙지 않습니다. 세율 15.4%를 가정하면 손익분기는 금리보다 늘 위에 있습니다.",
    data: [
      { label: "금리 3.0% → 세전", value: requiredGross(3, 15.4) },
      { label: "금리 4.0% → 세전", value: requiredGross(4, 15.4), emphasis: true },
      { label: "금리 5.0% → 세전", value: requiredGross(5, 15.4) },
      { label: "금리 6.0% → 세전", value: requiredGross(6, 15.4) },
    ],
    unit: "%",
    valueLabel: "필요 세전 수익률",
  },
  "home-purchase-cash-plan": {
    kind: "compare",
    title: "8억원 주택에서 집값과 별개로 나가는 계산 가능한 비용",
    caption: "무주택 일반세율 기준입니다. 법무·채권할인·이사비는 견적 전에는 확정되지 않아 제외했고, 실제로는 여기에 더 붙습니다.",
    data: [
      { label: "취득세", value: Math.round(acquisitionTax), emphasis: true },
      { label: "지방교육세", value: Math.round(acquisitionTax * 0.1) },
      { label: "중개보수 상한", value: Math.round(maximumBrokerFee(HOME_PRICE)) },
    ],
    valueLabel: "예상 금액",
  },
  "portfolio-rebalancing-rules": {
    kind: "compare",
    title: "같은 편차를 되돌리는 세 가지 방법의 이번 회차 비용",
    caption: "목표 70:30에서 76:24로 벌어진 1억원 포트폴리오에 신규 200만원을 넣는 경우입니다. 목표 비중에 정확히 맞추는 방식만 매도가 생겨 세금이 붙고, 나머지 두 방식은 이번 회차 비용이 사실상 없습니다.",
    data: [
      { label: "신규 투자금 우선", value: rebalanceCost("new") },
      { label: "허용범위까지만", value: rebalanceCost("partial") },
      { label: "정확한 조정", value: rebalanceCost("exact") },
    ],
    valueLabel: "수수료+세금",
  },
  "quant-backtest-checklist": {
    kind: "compare",
    title: "거래비용 0.3%를 빼먹었을 때 10년간 사라지는 수익률",
    caption: "매수와 매도 각각 0.3%를 가정하고 회전율만 바꾼 단순 누적입니다. 잦은 매매 전략일수록 백테스트가 현실보다 좋아 보입니다.",
    data: [
      { label: "연 1회 회전", value: 6 },
      { label: "연 4회 회전", value: 24, emphasis: true },
      { label: "연 12회 회전", value: 72 },
    ],
    unit: "%p",
    valueLabel: "10년 누적 비용",
  },
};
