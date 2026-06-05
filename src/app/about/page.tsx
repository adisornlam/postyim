import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";
import { db } from "@/db";
import { authors } from "@/db/schema";

export default async function AboutPage() {
  const team = await db.select().from(authors).limit(6);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <div className="space-y-8">
          <section className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight">About Postyim</h1>
            <p className="text-lg text-muted-foreground">
              Postyim is an AI-assisted editorial platform for product reviews
              and affiliate buying guides. AI helps draft content, but every
              publish-ready review goes through human approval.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Editorial standards</h2>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>Reviews must pass an automated quality checklist</li>
              <li>Human editors approve content before publication</li>
              <li>Affiliate relationships are disclosed on every review</li>
              <li>Product specs and pricing are refreshed on a regular cadence</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Authors</h2>
            <div className="space-y-4">
              {team.map((author) => (
                <article key={author.id} id={author.slug} className="rounded-xl border p-4">
                  <h3 className="font-medium">{author.name}</h3>
                  {author.title ? (
                    <p className="text-sm text-muted-foreground">{author.title}</p>
                  ) : null}
                  {author.bio ? (
                    <p className="mt-2 text-sm text-muted-foreground">{author.bio}</p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
