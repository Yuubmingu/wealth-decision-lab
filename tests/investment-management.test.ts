import { describe, expect, it } from "vitest";
import { calculateDcaComparison, calculateRebalancing, type DcaInputs, type RebalanceInputs } from "../app/lib/investment-management";

const dca:DcaInputs={amount:30_000_000,waitingCash:20_000_000,dcaMonths:6,annualReturn:0,cashRate:0,dropPercent:0,dropMonth:6,years:5,essentialExpenses:2_000_000,emergencyMonths:6,plannedCashUse:0,stressTolerance:3};
describe("목돈투자와 분할매수",()=>{
  it("수익률과 현금금리가 모두 0이면 두 방식의 종료금액이 같다",()=>{const r=calculateDcaComparison(dca);expect(r.results[0].lump.value).toBeCloseTo(r.results[0].dca.value,2)});
  it("상승 지속에서는 시장 노출이 긴 일시투자의 기대값이 높다",()=>{const r=calculateDcaComparison({...dca,annualReturn:8,dcaMonths:12});expect(r.results[0].lump.value).toBeGreaterThan(r.results[0].dca.value)});
  it("비상자금이 부족하면 목표 미달을 표시하되 투자 추천은 하지 않는다",()=>{const r=calculateDcaComparison({...dca,waitingCash:1_000_000});expect(r.verdict).toContain("비상자금 목표 미달");expect(r.verdict).not.toContain("추천")});
  it("분할 대기이자는 이자 반영 전 현금잔액에만 붙는다",()=>{const r=calculateDcaComparison({...dca,amount:1_200_000,dcaMonths:12,cashRate:12,years:1});const monthly=Math.pow(1.12,1/12)-1;let cash=1_200_000;let interest=0;for(let month=0;month<12;month+=1){const before=cash;cash*=1+monthly;interest+=cash-before;cash-=Math.min(100_000,cash)}expect(r.results[0].dca.interest).toBeCloseTo(interest,8)});
  it("예정 지출이 대기현금을 넘으면 비상자금보다 재원 부족을 먼저 알린다",()=>{const r=calculateDcaComparison({...dca,waitingCash:10_000_000,plannedCashUse:12_000_000});expect(r.safetyStatus).toBe("예정 지출 재원 부족")});
});

const rebalance:RebalanceInputs={assets:[{id:"etf",name:"ETF",value:70_000_000,target:65,change:0,taxRate:0,category:"ETF",leveraged:false,emergency:false},{id:"btc",name:"BTC",value:50_000_000,target:35,change:0,taxRate:0,category:"암호화폐",leveraged:false,emergency:false}],newMoney:1_550_000,monthlyContribution:1_550_000,threshold:5,method:"exact",feeRate:0,stressAssetId:"btc",stressDrop:50,reviewMonths:6};
describe("포트폴리오 리밸런싱",()=>{
  it("정확 조정 방식의 매수·매도 합계는 신규 투자금과 같다",()=>{const r=calculateRebalancing(rebalance);expect(r.rows.reduce((s,a)=>s+a.adjustment,0)).toBeCloseTo(rebalance.newMoney,2)});
  it("정확 조정 후 목표 비중으로 계산된다",()=>{const r=calculateRebalancing(rebalance);expect(r.rows[0].postWeight).toBeCloseTo(65,5);expect(r.rows[1].postWeight).toBeCloseTo(35,5)});
  it("신규 자금 우선 방식은 부족한 ETF에 더 많이 배분한다",()=>{const r=calculateRebalancing({...rebalance,method:"new"});expect(r.rows[0].newAllocation).toBeGreaterThan(r.rows[1].newAllocation)});
  it("부분 조정 방식은 신규 투자금과 매도대금을 함께 매수재원으로 쓴다",()=>{const r=calculateRebalancing({...rebalance,method:"partial",threshold:1});const buys=r.rows.reduce((s,a)=>s+Math.max(a.adjustment,0),0);expect(buys).toBeLessThanOrEqual(r.partialBuyBudget+1);expect(r.partialBuyBudget).toBe(rebalance.newMoney+r.partialSellProceeds)});
  it("매도 없는 복귀 자금은 목표비중이 아니라 허용 상단을 기준으로 계산한다",()=>{const r=calculateRebalancing(rebalance);const expected=50_000_000/.4-120_000_000;expect(r.requiredNewMoney).toBeCloseTo(expected,2)});
  it("사용자가 입력한 허용편차를 상태 판정에 쓴다",()=>{expect(calculateRebalancing({...rebalance,threshold:10}).status).toBe("사용자 허용범위 안");expect(calculateRebalancing({...rebalance,threshold:1}).status).toBe("사용자 허용범위 밖")});
  it("목표 비중 합계가 100%가 아니면 조정금액을 만들지 않는다",()=>{const r=calculateRebalancing({...rebalance,assets:rebalance.assets.map((asset,index)=>({...asset,target:index===0?50:30}))});expect(r.targetValid).toBe(false);expect(r.canExecute).toBe(false);expect(r.rows.every(row=>row.adjustment===0)).toBe(true)});
  it("취득원가가 없으므로 세율은 양도차익이 아니라 매도대금에 적용한다",()=>{const assets=rebalance.assets.map(asset=>asset.id==="btc"?{...asset,taxRate:10}:asset);const r=calculateRebalancing({...rebalance,assets,method:"exact"});const btc=r.rows.find(row=>row.id==="btc")!;expect(btc.adjustment).toBeLessThan(0);expect(btc.tax).toBeCloseTo(Math.abs(btc.adjustment)*.1,5)});
  it.each(["exact","partial"] as const)("%s 방식은 순매도대금과 신규자금 안에서 매수비용까지 충당한다",(method)=>{const assets=rebalance.assets.map(asset=>asset.id==="btc"?{...asset,taxRate:10}:asset);const r=calculateRebalancing({...rebalance,assets,method,threshold:1,feeRate:1});const buys=r.rows.filter(row=>row.adjustment>0);const sells=r.rows.filter(row=>row.adjustment<0);const buySpend=buys.reduce((sum,row)=>sum+row.adjustment+row.fee,0);const available=rebalance.newMoney+sells.reduce((sum,row)=>sum+Math.abs(row.adjustment)-row.fee-row.tax,0);expect(buySpend).toBeLessThanOrEqual(available+1e-5)});
  it("신규자금 방식도 매수 수수료를 신규자금 안에서 충당한다",()=>{const r=calculateRebalancing({...rebalance,method:"new",feeRate:1});const spend=r.rows.reduce((sum,row)=>sum+Math.max(row.adjustment,0)+row.fee,0);expect(spend).toBeLessThanOrEqual(rebalance.newMoney+1e-5)});
});
