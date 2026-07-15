import HeroArtist from "../components/artist/HeroArtist";
import CreateRecordRelease from "../components/artist/CreateRecordRelease";
import StepsOverview from "../components/artist/StepsOverview";
import HowItWorksList from "../components/artist/HowItWorksList";
import TapIntoNetwork from "../components/artist/TapIntoNetwork";
import { usePageMeta } from "../hooks/usePageMeta";
import { useTranslation } from "react-i18next";

export default function ArtistPage() {
  const { t } = useTranslation();
  usePageMeta({
    title: t("artist.meta.title"),
    description: t("artist.meta.description"),
    canonicalPath: "/",
  });

  return (
    <>
      <HeroArtist />
      <CreateRecordRelease />
      <StepsOverview />
      <HowItWorksList />
      <TapIntoNetwork />
    </>
  );
}
