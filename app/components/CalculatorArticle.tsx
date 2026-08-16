import Link from "next/link";
import type { CalculatorContent } from "../calculators/content/types";
import { calculatorCharts } from "../calculators/content/charts";
import { CompareBarChart, MilestoneStackChart } from "./charts/Charts";
import { pageUrl } from "../seo";

/**
 * 계산기 아래에 붙는 본문 섹션.
 *
 * 계산기 UI는 크롤러가 읽을 수 있는 텍스트를 거의 남기지 않으므로,
 * 공식·해석·미반영 항목·FAQ를 페이지마다 고유한 본문으로 제공합니다.
 * FAQ 는 화면 표시와 별개로 FAQPage 구조화 데이터로도 내보냅니다.
 */
export function CalculatorArticle({ content }: { content: CalculatorContent }) {
  return (
    <>
      <FaqStructuredData content={content} />

      <section className="shell calculator-article" aria-labelledby="calculator-article-title">
        <div>
          <p className="eyebrow">{content.eyebrow}</p>
          <h2 id="calculator-article-title">{content.lede}</h2>
        </div>

        <div>
          {content.intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}

          <h3>{content.formula.heading}</h3>
          <p>{content.formula.intro}</p>
          <ol className="formula-steps">
            {content.formula.steps.map((step) => (
              <li key={step.label}>
                <strong>{step.label}</strong>
                <code>{step.expr}</code>
                <span>{step.detail}</span>
              </li>
            ))}
          </ol>
          {content.formula.note ? <p className="article-note">{content.formula.note}</p> : null}

          {content.worked ? (
            <div className="worked-example">
              <h3>{content.worked.heading}</h3>
              <p className="worked-setup">{content.worked.setup}</p>
              <dl>
                {content.worked.lines.map((line) => (
                  <div key={line.label}>
                    <dt>{line.label}</dt>
                    <dd>{line.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="worked-reading">{content.worked.reading}</p>
            </div>
          ) : null}

          <ArticleChart path={content.path} />

          {content.reading.map((step) => (
            <div key={step.heading}>
              <h3>{step.heading}</h3>
              {step.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          ))}

          <h3>이 계산에 넣지 않은 것</h3>
          <ul className="exclusion-list">
            {content.exclusions.map((exclusion) => (
              <li key={exclusion.item}>
                <strong>{exclusion.item}</strong>
                <span>{exclusion.why}</span>
              </li>
            ))}
          </ul>

          {content.misconceptions?.length ? (
            <>
              <h3>자주 잘못 읽는 방식</h3>
              <ul className="misconception-list">
                {content.misconceptions.map((misconception) => (
                  <li key={misconception.claim}>
                    <p className="misconception-claim">“{misconception.claim}”</p>
                    <p className="misconception-correction">{misconception.correction}</p>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <h3>자주 묻는 질문</h3>
          {content.faqs.map((faq) => (
            <details key={faq.q}>
              <summary>{faq.q}</summary>
              <p>{faq.a}</p>
            </details>
          ))}

          {content.sources?.length ? (
            <>
              <h3>참고한 공개 자료</h3>
              <ul className="source-list">
                {content.sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
                    <span>{source.publisher}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {content.related?.length ? (
            <>
              <h3>이어서 확인할 계산</h3>
              <ul className="related-list">
                {content.related.map((related) => (
                  <li key={related.href}>
                    <Link href={related.href}>{related.label}</Link>
                    <span>{related.note}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <p className="article-closing">{content.closing}</p>
        </div>
      </section>
    </>
  );
}

/** 계산기 안의 Recharts 그래프는 정적 HTML에 남지 않으므로 본문용 SVG를 따로 그립니다. */
function ArticleChart({ path }: { path: string }) {
  const chart = calculatorCharts[path];
  if (!chart) return null;
  return chart.kind === "milestones"
    ? <MilestoneStackChart title={chart.title} caption={chart.caption} data={chart.data} principalLabel={chart.principalLabel} profitLabel={chart.profitLabel} />
    : <CompareBarChart title={chart.title} caption={chart.caption} data={chart.data} unit={chart.unit} valueLabel={chart.valueLabel} />;
}

function FaqStructuredData({ content }: { content: CalculatorContent }) {
  const payload = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${pageUrl(content.path)}#faq`,
    mainEntity: content.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return (
    <script
      type="application/ld+json"
      // 콘텐츠는 빌드 시점에 고정된 자체 데이터이므로 사용자 입력이 섞이지 않습니다.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload).replace(/</g, "\\u003c") }}
    />
  );
}
