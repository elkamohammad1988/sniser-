import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, m } from "framer-motion";
import RootLayout from "./components/layout/RootLayout";
import PageFallback from "./components/layout/PageFallback";
import ArtistPage from "./pages/ArtistPage";
import ScrollToTop from "./components/shared/ScrollToTop";
import BackToTop from "./components/shared/BackToTop";
import CookieBanner from "./components/shared/CookieBanner";
import RequireAuth from "./components/shared/RequireAuth";
import { ModalProvider } from "./components/shared/ModalProvider";
import { ToastProvider } from "./components/shared/ToastProvider";
import { SessionProvider } from "./components/shared/SessionProvider";
import LocaleShell from "./i18n/LocaleShell";
import { stripLocale } from "./i18n/paths";
import { EASE_SOFT } from "./lib/motion/variants";

// Lazy-load every secondary route. ArtistPage stays eager because it's the
// homepage — anything else only loads when its tab is visited.
const ViewerPage = lazy(() => import("./pages/ViewerPage"));
const BrowsePage = lazy(() => import("./pages/BrowsePage"));
const FaqPage = lazy(() => import("./pages/FaqPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const TermsPage = lazy(() => import("./pages/legal/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/legal/PrivacyPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const LibraryPage = lazy(() => import("./pages/LibraryPage"));
const WalletPage = lazy(() => import("./pages/WalletPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const StudioPage = lazy(() => import("./pages/StudioPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));

export default function App() {
  const location = useLocation();
  // The locale lives in the URL's first segment (English unprefixed). Strip it
  // so the route table below is written once, in clean paths, and matches every
  // language. LocaleLink re-adds the prefix on outgoing navigation.
  const bare = stripLocale(location.pathname);
  const routeLocation = { ...location, pathname: bare };

  return (
    <SessionProvider>
      <ToastProvider>
        <ModalProvider>
        <ScrollToTop />
        <RootLayout>
          <LocaleShell>
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={bare}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: EASE_SOFT }}
            >
              <Suspense fallback={<PageFallback />}>
                <Routes location={routeLocation}>
                  <Route path="/" element={<ArtistPage />} />
                  <Route path="/viewer" element={<ViewerPage />} />
                  <Route path="/browse" element={<BrowsePage />} />
                  <Route path="/faq" element={<FaqPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/verify-email" element={<VerifyEmailPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/library" element={<RequireAuth><LibraryPage /></RequireAuth>} />
                  <Route path="/wallet" element={<RequireAuth><WalletPage /></RequireAuth>} />
                  <Route path="/account" element={<RequireAuth><AccountPage /></RequireAuth>} />
                  <Route path="/studio" element={<RequireAuth><StudioPage /></RequireAuth>} />
                  <Route path="/admin" element={<RequireAuth role="admin"><AdminPage /></RequireAuth>} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </m.div>
          </AnimatePresence>
          </LocaleShell>
        </RootLayout>
          <BackToTop />
          <CookieBanner />
        </ModalProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
