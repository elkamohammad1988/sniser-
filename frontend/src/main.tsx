import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import MotionProvider from "./lib/motion/MotionProvider";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import { initI18n, loadLocale } from "./i18n";
import { localeFromPath } from "./i18n/paths";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found in index.html");
}

/**
 * Bootstrap i18n for the locale implied by the entry URL *before* the first
 * render, so the initial paint is already in the right language (and RTL when
 * the URL is an Arabic route). Non-default bundles are code-split and awaited
 * here once; subsequent switches are handled by <LocaleShell>.
 */
async function bootstrap() {
  const initial = localeFromPath(window.location.pathname);
  await initI18n(initial);
  await loadLocale(initial);

  ReactDOM.createRoot(rootElement as HTMLElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <MotionProvider>
            <App />
          </MotionProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  );
}

void bootstrap();
