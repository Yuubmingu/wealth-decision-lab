import { formatMoney } from "../../lib/finance";
import { MAX_BAR, SERIES, SURFACE_GAP, barPath, columnPath, niceTicks } from "./primitives";

/**
 * 본문용 정적 SVG 차트.
 *
 * 자바스크립트를 쓰지 않습니다. 값은 축 눈금, 선택적 직접 라벨,
 * SVG <title> 기본 툴팁, 그리고 항상 함께 붙는 표로 읽을 수 있습니다.
 * 툴팁만으로 읽어야 하는 값은 두지 않습니다.
 */

type FigureProps = {
  title: string;
  caption: string;
  children: React.ReactNode;
  legend?: { label: string; color: string }[];
  table: { head: string[]; rows: string[][] };
  tableSummary?: string;
};

function ChartFigure({ title, caption, children, legend, table, tableSummary }: FigureProps) {
  return (
    <figure className="chart-figure">
      <figcaption>
        <strong>{title}</strong>
        <span>{caption}</span>
      </figcaption>

      {/* 계열이 둘 이상이면 범례를 항상 둡니다. 색만으로 정체성을 구분하지 않습니다. */}
      {legend && legend.length > 1 ? (
        <ul className="chart-legend">
          {legend.map((item) => (
            <li key={item.label}>
              <span className="chart-swatch" style={{ background: item.color }} aria-hidden="true" />
              {item.label}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="chart-plot">{children}</div>

      <details className="chart-table">
        <summary>{tableSummary ?? "표로 보기"}</summary>
        <table>
          <thead>
            <tr>{table.head.map((cell) => <th key={cell} scope="col">{cell}</th>)}</tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row[0]}>
                {row.map((cell, index) => index === 0
                  ? <th key={cell} scope="row">{cell}</th>
                  : <td key={`${row[0]}-${index}`}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

export type MilestonePoint = { label: string; principal: number; profit: number };

/**
 * 납입 원금과 복리수익의 부분-전체 관계를 시점별로 보여주는 누적 세로막대.
 * 아래 칸이 원금, 위 칸이 수익이며 둘 사이는 배경색 간격으로 가릅니다.
 */
export function MilestoneStackChart({
  title,
  caption,
  data,
  principalLabel = "납입 원금",
  profitLabel = "복리 수익",
}: {
  title: string;
  caption: string;
  data: MilestonePoint[];
  principalLabel?: string;
  profitLabel?: string;
}) {
  const W = 640, H = 300, padL = 78, padR = 20, padT = 24, padB = 42;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const baseline = padT + plotH;
  const totals = data.map((d) => d.principal + d.profit);
  const { top, ticks } = niceTicks(Math.max(...totals));
  const band = plotW / data.length;
  const barW = Math.min(MAX_BAR, band * 0.34);
  const yOf = (value: number) => baseline - (value / top) * plotH;

  return (
    <ChartFigure
      title={title}
      caption={caption}
      legend={[{ label: principalLabel, color: SERIES.primary }, { label: profitLabel, color: SERIES.secondary }]}
      table={{
        head: ["시점", principalLabel, profitLabel, "합계"],
        rows: data.map((d) => [d.label, formatMoney(d.principal), formatMoney(d.profit), formatMoney(d.principal + d.profit)]),
      }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${title}-t`} className="chart-svg">
        <title id={`${title}-t`}>{title}</title>

        {/* 눈금선은 배경에서 한 단계만 벗어난 실선 헤어라인으로 물러나 있습니다. */}
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={padL} x2={W - padR} y1={yOf(tick)} y2={yOf(tick)} className="chart-grid" />
            <text x={padL - 10} y={yOf(tick) + 4} className="chart-axis-text" textAnchor="end">{formatMoney(tick)}</text>
          </g>
        ))}

        {data.map((d, i) => {
          const cx = padL + band * (i + 0.5);
          const x = cx - barW / 2;
          const topPrincipal = yOf(d.principal);
          const topTotal = yOf(d.principal + d.profit);
          const profitH = topPrincipal - SURFACE_GAP - topTotal;
          return (
            <g key={d.label}>
              <title>{`${d.label} · ${principalLabel} ${formatMoney(d.principal)} · ${profitLabel} ${formatMoney(d.profit)}`}</title>
              <path d={columnPath(x, topPrincipal, barW, baseline - topPrincipal, false)} fill={SERIES.primary} />
              {profitH > 0 ? <path d={columnPath(x, topTotal, barW, profitH, true)} fill={SERIES.secondary} /> : null}
              {/* 합계만 캡 위에 직접 라벨합니다. 모든 값에 숫자를 붙이지 않습니다. */}
              <text x={cx} y={topTotal - 9} className="chart-value-text" textAnchor="middle">{formatMoney(d.principal + d.profit)}</text>
              <text x={cx} y={baseline + 22} className="chart-axis-text" textAnchor="middle">{d.label}</text>
            </g>
          );
        })}

        <line x1={padL} x2={W - padR} y1={baseline} y2={baseline} className="chart-axis" />
      </svg>
    </ChartFigure>
  );
}

export type CompareItem = { label: string; value: number; emphasis?: boolean };

/**
 * 크기 비교용 가로 막대. 이름이 긴 한국어 항목에 맞춰 가로로 눕혔습니다.
 * 항목에 자연스러운 순서가 없으므로 값에 따라 색을 바꾸지 않고
 * 모든 막대가 같은 슬롯 색을 씁니다. emphasis를 준 항목만 앞으로 나오고
 * 나머지는 뒤로 물러나는 강조 형식으로 바뀝니다.
 */
export function CompareBarChart({
  title,
  caption,
  data,
  unit = "원",
  valueLabel = "금액",
}: {
  title: string;
  caption: string;
  data: CompareItem[];
  unit?: string;
  valueLabel?: string;
}) {
  const hasEmphasis = data.some((d) => d.emphasis);
  const W = 640, rowH = 42, padL = 168, padR = 96, padT = 12, padB = 12;
  const H = padT + padB + rowH * data.length;
  const plotW = W - padL - padR;
  const max = Math.max(...data.map((d) => Math.abs(d.value)));
  const barH = Math.min(MAX_BAR, rowH * 0.5);

  return (
    <ChartFigure
      title={title}
      caption={caption}
      table={{
        head: ["항목", valueLabel],
        rows: data.map((d) => [d.label, unit === "원" ? formatMoney(d.value) : `${d.value.toLocaleString("ko-KR")}${unit}`]),
      }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${title}-t`} className="chart-svg">
        <title id={`${title}-t`}>{title}</title>
        {data.map((d, i) => {
          const y = padT + rowH * i + (rowH - barH) / 2;
          const w = max > 0 ? (Math.abs(d.value) / max) * plotW : 0;
          const dim = hasEmphasis && !d.emphasis;
          const text = unit === "원" ? formatMoney(d.value) : `${d.value.toLocaleString("ko-KR")}${unit}`;
          return (
            <g key={d.label}>
              <title>{`${d.label} · ${text}`}</title>
              <text x={padL - 12} y={y + barH / 2 + 4} className="chart-axis-text" textAnchor="end">{d.label}</text>
              <path d={barPath(padL, y, w, barH)} fill={dim ? SERIES.muted : SERIES.primary} />
              {/* 막대 끝 바깥에 값을 두어 좁은 막대에서도 글자가 잘리지 않습니다. */}
              <text x={padL + w + 10} y={y + barH / 2 + 4} className="chart-value-text">{text}</text>
            </g>
          );
        })}
        <line x1={padL} x2={padL} y1={padT} y2={H - padB} className="chart-axis" />
      </svg>
    </ChartFigure>
  );
}
