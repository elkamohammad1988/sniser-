import LegalPage from "./LegalPage";
import { usePageMeta } from "../../hooks/usePageMeta";
import { COMPANY_LEGAL_NAME, SUPPORT_EMAIL } from "../../utils/constants";

export default function PrivacyPage() {
  usePageMeta({
    title: "Privacy Policy — Sniser",
    description:
      "What Sniser collects, why, who we share it with, and how to exercise your data rights.",
    canonicalPath: "/privacy",
  });

  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      effective="May 17, 2026"
      summary={`This is a placeholder Privacy Policy intended to be replaced by ${COMPANY_LEGAL_NAME}'s qualified counsel ahead of launch. It is not legal advice.`}
    >
      <section>
        <h2>1. What we collect</h2>
        <ul>
          <li>Account data: email, display name, and authentication tokens.</li>
          <li>Wallet data: public wallet address(es) you connect. We never store private keys.</li>
          <li>Payment data: handled by Crossmint; we receive a transaction reference, not card numbers.</li>
          <li>Usage data: pages visited, drops viewed, basic device info, IP — used to operate and improve the service.</li>
        </ul>
      </section>

      <section>
        <h2>2. How we use it</h2>
        <p>
          To deliver and secure the service, fulfill purchases, pay artist royalties, comply with legal obligations, and
          improve product quality. We do not sell personal data.
        </p>
      </section>

      <section>
        <h2>3. Cookies and analytics</h2>
        <p>
          Essential cookies keep you signed in and your cart consistent. Analytics cookies are optional and only set after
          you accept them via the cookie banner. You can change consent at any time.
        </p>
      </section>

      <section>
        <h2>4. Sharing</h2>
        <ul>
          <li>Payment processor (Crossmint) — to settle purchases.</li>
          <li>Cloud infrastructure providers — to host the service.</li>
          <li>Law enforcement — only when legally required and after due review.</li>
        </ul>
      </section>

      <section>
        <h2>5. Your rights</h2>
        <p>
          Subject to local law, you can request access to, correction of, or deletion of your personal data. To exercise
          these rights, email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> from the address on the account.
        </p>
      </section>

      <section>
        <h2>6. Data retention</h2>
        <p>
          Account data is retained for as long as the account is active, plus the period required to meet tax and audit
          obligations. On-chain transactions are public by nature and cannot be deleted.
        </p>
      </section>

      <section>
        <h2>7. Security</h2>
        <p>
          We use encryption in transit (TLS) and at rest, scoped access controls, and routine reviews. No system is fully
          secure — please use a strong password and a separate, hardware-backed wallet for high-value holdings.
        </p>
      </section>

      <section>
        <h2>8. Changes</h2>
        <p>
          We will announce material changes to this Policy via email or in-app notification at least 14 days before they
          take effect.
        </p>
      </section>

      <section>
        <h2>9. Contact</h2>
        <p>
          Privacy questions or data requests: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </section>
    </LegalPage>
  );
}
