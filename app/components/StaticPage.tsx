import { PageIntro } from "./SiteChrome";

export function StaticPage({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main>
      <PageIntro eyebrow={eyebrow} title={title} description={description} />
      <article className="shell prose-page" aria-labelledby="page-title">{children}</article>
    </main>
  );
}
