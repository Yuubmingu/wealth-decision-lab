import { describe, expect, it } from "vitest";
import { calculateDcaComparison, calculateRebalancing, type DcaInputs, type RebalanceInputs } from "../app/lib/investment-management";

const dca:DcaInputs={amount:30_000_000,waitingCash:20_000_000,dcaMonths:6,annualReturn:0,cashRate:0,dropPercent:0,dropMonth:6,years:5,essentialExpenses:2_000_000,emergencyMonths:6,plannedCashUse:0,stressTolerance:3};
describe("목돈투자와 분할매수",()=>{
  it("수익률과 현금금리가 모두 0이면 두 방식의 종료금액이 같다",()=>{const r=calculateDcaComparison(dca);expect(r.results[0].lump.value).toBeCloseTo(r.results[0].dca.value,2)});
  it("상승 지속에서는 시장 노출이 긴 일시투자의 기대값이 높다",()=>{const r=calculateDcaComparison({...dca,annualReturn:8,dcaMonths:12});expect(r.results[0].lump.value).toBeGreaterThan(r.results[0].dca.value)});
  it("비상자금이 부족하면 목돈투자 부적합을 표시한다",()=>{const r=calculateDcaComparison({...dca,waitingCash:1_000_000});expect(r.verdict).toContain("비상자금 부족")});
});

const rebalance:RebalanceInputs={assets:[{id:"etf",name:"ETF",value:70_000_000,target:65,change:0,taxRate:0,category:"ETF",leveraged:false,emergency:false},{id:"btc",name:"BTC",value:50_000_000,target:35,change:0,taxRate:0,category:"암호화폐",leveraged:false,emergency:false}],newMoney:1_550_000,monthlyContribution:1_550_000,threshold:5,method:"exact",feeRate:0,stressAssetId:"btc",stressDrop:50,reviewMonths:6};
describe("포트폴리오 리밸런싱",()=>{
  it("정확 조정 방식의 매수·매도 합계는 신규 투자금과 같다",()=>{const r=calculateRebalancing(rebalance);expect(r.rows.reduce((s,a)=>s+a.adjustment,0)).toBeCloseTo(rebalance.newMoney,2)});
  it("정확 조정 후 목표 비중으로 계산된다",()=>{const r=calculateRebalancing(rebalance);expect(r.rows[0].postWeight).toBeCloseTo(65,5);expect(r.rows[1].postWeight).toBeCloseTo(35,5)});
  it("신규 자금 우선 방식은 부족한 ETF에 더 많이 배분한다",()=>{const r=calculateRebalancing({...rebalance,method:"new"});expect(r.rows[0].newAllocation).toBeGreaterThan(r.rows[1].newAllocation)});
  it("부분 조정 방식의 매수 합계는 신규 투자금을 넘지 않는다",()=>{const r=calculateRebalancing({...rebalance,method:"partial",threshold:1});expect(r.rows.reduce((s,a)=>s+Math.max(a.adjustment,0),0)).toBeLessThanOrEqual(rebalance.newMoney+1)});
  it("매도 없는 복귀 자금은 목표비중이 아니라 허용 상단을 기준으로 계산한다",()=>{const r=calculateRebalancing(rebalance);const expected=50_000_000/.4-120_000_000;expect(r.requiredNewMoney).toBeCloseTo(expected,2)});
});
