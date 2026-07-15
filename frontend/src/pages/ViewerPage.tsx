import { useTranslation } from "react-i18next";
import HeroViewer from "../components/viewer/HeroViewer";
import ViewerStepsList from "../components/viewer/ViewerStepsList";
import PaymentMethods from "../components/viewer/PaymentMethods";
import FeaturesBar from "../components/viewer/FeaturesBar";
import { usePageMeta } from "../hooks/usePageMeta";

export default function ViewerPage() {
  const { t } = useTranslation();
  usePageMeta({
    title: t("viewer.meta.title"),
    description: t("viewer.meta.description"),
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
