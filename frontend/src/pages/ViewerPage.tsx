import HeroViewer from "../components/viewer/HeroViewer";
import ViewerStepsList from "../components/viewer/ViewerStepsList";
import PaymentMethods from "../components/viewer/PaymentMethods";
import FeaturesBar from "../components/viewer/FeaturesBar";
import { usePageMeta } from "../hooks/usePageMeta";

export default function ViewerPage() {
  usePageMeta({
    title: "How to View Content on Sniser",
    description:
      "Sign in with Crossmint, verify your access on-chain, and watch exclusive content anywhere. Resell your access anytime on the Sniser Marketplace.",
    canonicalPath: "/viewer",
  });

  return (
    <>
      <HeroViewer />
      <ViewerStepsList />
      <PaymentMethods />
      <FeaturesBar />
    </>
  );
}
