export const guides = [
  { slug: "rent-100k-15years", category: "주거비", title: "월세 10만원 차이가 15년 뒤 자산에 미치는 영향", summary: "작은 고정비 차이가 투자로 연결될 때 장기 자산에 어떤 변화를 만드는지 살펴봅니다." },
  { slug: "rent-saving-gap", category: "주거비", title: "월세를 줄였는데 투자금이 늘지 않는 이유", summary: "절감액이 소비로 흡수되는 생활수준 팽창을 점검합니다." },
  { slug: "base-vs-bonus", category: "이직", title: "이직할 때 기본급과 성과급을 구분해야 하는 이유", summary: "확정 보상과 조건부 보상을 같은 가치로 해석하지 않기 위한 비교 방법을 설명합니다." },
  { slug: "bonus-probability", category: "이직", title: "성과급 지급 가능성을 반영한 연봉 비교법", summary: "예상 성과급에 지급 확률을 반영해 기대 보상을 계산합니다." },
  { slug: "salary-10m", category: "연봉", title: "연봉 1,000만원 상승분을 투자했을 때의 장기 효과", summary: "세후 반영률과 투자비율에 따라 15년 뒤 예상자산이 달라지는 과정을 살펴봅니다." },
  { slug: "commute-cost", category: "이직", title: "출퇴근 시간을 비용으로 환산하는 방법과 한계", summary: "시간비용을 숫자로 비교할 때 놓치기 쉬운 가정과 한계를 정리합니다." },
  { slug: "monthly-130-vs-250", category: "투자금", title: "월 투자금 130만원과 250만원의 15년 차이", summary: "수익률보다 통제 가능한 월 투자금의 영향부터 비교합니다." },
  { slug: "startup-stock-options", category: "이직", title: "스타트업 이직 제안에서 스톡옵션을 별도로 봐야 하는 이유", summary: "현금 보상과 아직 현금화되지 않은 권리를 구분하여 살펴봅니다." },
  { slug: "lower-return-assumption", category: "계산법", title: "경제적 자유 계산에서 수익률 가정을 낮춰야 하는 이유", summary: "낙관적인 단일 수익률 대신 보수·기준·성장 시나리오를 함께 봅니다." },
  { slug: "lifestyle-inflation", category: "연봉", title: "이직 후 생활수준을 올리면 자산이 늘지 않는 이유", summary: "연봉 상승이 자동으로 자산 상승이 되지 않는 구조를 설명합니다." },
];

export function getGuide(slug: string) { return guides.find((guide) => guide.slug === slug); }
