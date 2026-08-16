/**
 * 차트 공용 상수와 기하 헬퍼.
 *
 * 색은 눈으로 고르지 않고 검증기를 돌려 확정했습니다.
 * 브랜드 그린(#145c45)은 차트 마크로 쓰기에 너무 어둡고(OKLCH L 0.425)
 * 채도도 낮아(C 0.079) 밝기 대역·채도 하한을 모두 통과하지 못했습니다.
 * 같은 색상각(H 166.7°)을 유지한 채 밝기와 채도만 올린 #038d69(H 167.0°)로
 * 스냅했고, 브랜드 오렌지와 함께 여섯 개 검사를 모두 통과합니다.
 *   밝기 대역 PASS · 채도 하한 PASS · 색각 분리 ΔE 9.1(목표 8 이상) PASS
 *   일반시야 하한 ΔE 24.7 PASS · 배경 대비 3:1 이상 PASS
 * 색을 바꿀 때는 반드시 검증기를 다시 돌리세요.
 */
export const SERIES = {
  /** 슬롯 1 · 원금, 확정된 값, 단일 계열 막대 */
  primary: "#038d69",
  /** 슬롯 2 · 복리수익, 대안 시나리오처럼 정체성이 다른 두 번째 계열 */
  secondary: "#c6532f",
  /** 강조 형식에서 뒤로 물러나는 계열 */
  muted: "#bcc5bf",
} as const;

/** 스택 세그먼트와 인접 막대를 갈라 주는 배경색 간격. 테두리를 그리지 않습니다. */
export const SURFACE_GAP = 2;
/** 데이터 끝단 모서리 반경. 기준선 쪽은 각지게 둡니다. */
export const END_RADIUS = 4;
/** 마크 두께 상한. 슬롯을 꽉 채우지 않고 남는 자리는 여백으로 둡니다. */
export const MAX_BAR = 24;

/** 기준선에서 위로 자라는 세로 막대. 데이터 끝단만 둥글게 처리합니다. */
export function columnPath(x: number, y: number, w: number, h: number, roundTop: boolean) {
  if (h <= 0) return "";
  const r = roundTop ? Math.min(END_RADIUS, h, w / 2) : 0;
  if (r <= 0) return `M${x},${y} h${w} v${h} h${-w} Z`;
  return `M${x},${y + h} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h} Z`;
}

/** 왼쪽 기준선에서 오른쪽으로 자라는 가로 막대. */
export function barPath(x: number, y: number, w: number, h: number) {
  if (w <= 0) return "";
  const r = Math.min(END_RADIUS, w, h / 2);
  if (r <= 0) return `M${x},${y} h${w} v${h} h${-w} Z`;
  return `M${x},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} L${x},${y + h} Z`;
}

/**
 * 축 눈금을 사람이 읽는 값으로 맞춥니다.
 * 1·2·2.5·5·10 배수만 사용하고, 최대값을 덮는 가장 작은 눈금을 고릅니다.
 */
export function niceTicks(max: number, count = 4) {
  if (!(max > 0)) return { top: 1, ticks: [0, 1] };
  const rawStep = max / count;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const step = [1, 2, 2.5, 5, 10]
    .map((m) => m * magnitude)
    .find((candidate) => candidate >= rawStep) ?? 10 * magnitude;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= top + step / 2; value += step) ticks.push(value);
  return { top, ticks };
}
