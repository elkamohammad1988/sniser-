import LegalPage from "./LegalPage";
import { usePageMeta } from "../../hooks/usePageMeta";
import { COMPANY_LEGAL_NAME, SUPPORT_EMAIL } from "../../utils/constants";

export default function TermsPage() {
  usePageMeta({
    title: "Terms of Service — Sniser",
    description:
      "Read the terms that govern your use of Sniser — accounts, access passes, payments, royalties, and dispute resolution.",
    canonicalPath: "/terms",
  });

  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      effective="May 17, 2026"
      summary={`These are placeholder Terms. Before public launch, ${COMPANY_LEGAL_NAME} should replace them with the version reviewed by qualified counsel in every jurisdiction where Sniser operates.`}
    >
      <section>
        <h2>1. Agreement</h2>
        <p>
          By creating an account, connecting a wallet, or purchasing an access pass on Sniser, you agree to these Terms.
          If you don't agree, you must not use the service.
        </p>
      </section>

      <section>
        <h2>2. Accounts</h2>
        <p>
          You can sign in with an email address (via Crossmint) or a self-custody wallet. You are responsible for safeguarding
          your credentials. Sniser never stores seed phrases and cannot recover a wallet for you.
        </p>
      </section>

      <section>
        <h2>3. Access passes</h2>
        <p>
          An access pass is a transferable digital asset that grants the holder the right to stream the associated content
          for as long as they hold the pass. Selling or transferring the pass transfers access; Sniser revokes the previous
          holder's playback automatically.
        </p>
        <ul>
          <li>Access passes are not investments. Their value depends on demand and is not guaranteed.</li>
          <li>Resale royalties are encoded in each pass and paid to the artist on every transfer.</li>
          <li>Sniser does not custody assets — passes live in your connected wallet.</li>
        </ul>
      </section>

      <section>
        <h2>4. Payments and fees</h2>
        <p>
          Card payments are processed by Crossmint; on-chain payments settle in USDC. Sniser charges a 10% platform fee on
          primary drops and a 2.5% fee on resale. Artists set their own prices and royalty splits.
        </p>
      </section>

      <section>
        <h2>5. Artist agreements</h2>
        <p>
          Releases on Sniser are platform-exclusive for the period defined in each artist agreement. Artists retain ownership
          of their masters. The full artist agreement is provided before signing.
        </p>
      </section>

      <section>
        <h2>6. Prohibited use</h2>
        <ul>
          <li>Circumventing the access-pass mechanism (recording, scraping, or sharing decoded streams).</li>
          <li>Reselling content you do not hold a valid pass for.</li>
          <li>Automated scraping of catalog metadata at a rate that affects service quality.</li>
        </ul>
      </section>

      <section>
        <h2>7. Disclaimer and liability</h2>
        <p>
          The service is provided "as is" without warranties of any kind. To the maximum extent permitted by law, Sniser is
          not liable for indirect, incidental, or consequential damages arising from your use of the service.
        </p>
      </section>

      <section>
        <h2>8. Changes</h2>
        <p>
          We may update these Terms. Material changes will be announced via email or in-app notification at least 14 days
          before they take effect.
        </p>
      </section>

      <section>
        <h2>9. Contact</h2>
        <p>
          Questions about these Terms: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </section>
    </LegalPage>
  );
}
