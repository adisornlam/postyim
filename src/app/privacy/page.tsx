import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 prose prose-neutral dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p>Last updated: {new Date().toLocaleDateString("en-US")}</p>
        <p>
          Postyim respects your privacy. This policy explains what information
          we collect and how we use it.
        </p>
        <h2>Information we collect</h2>
        <ul>
          <li>Basic usage data such as pages visited and referral source</li>
          <li>Hashed IP addresses when affiliate links are clicked</li>
          <li>Browser user agent for aggregate analytics</li>
        </ul>
        <h2>How we use information</h2>
        <p>
          We use collected data to understand site performance, improve content,
          and measure affiliate link engagement. We do not sell personal data.
        </p>
        <h2>Cookies</h2>
        <p>
          We may use cookies or similar technologies for analytics and session
          management. You can control cookies through your browser settings.
        </p>
        <h2>Contact</h2>
        <p>
          For privacy questions, contact us through the website operator listed
          on the About page.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
