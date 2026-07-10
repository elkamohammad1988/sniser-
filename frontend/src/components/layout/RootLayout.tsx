import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "../shared/Navbar";
import Footer from "../shared/Footer";

interface Props {
  children: ReactNode;
}

/**
 * Page shell shared by every route: skip link → navbar → main → footer.
 * Pages render only their content; chrome lives here so it doesn't
 * re-mount on navigation and isn't re-downloaded by lazy chunks.
 */
export default function RootLayout({ children }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-[100] focus-visible:rounded-md focus-visible:bg-brand-green focus-visible:px-4 focus-visible:py-2 focus-visible:text-bg focus-visible:font-semibold focus-visible:shadow-card"
      >
        {t("a11y.skipToContent")}
      </a>
      <Navbar />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
