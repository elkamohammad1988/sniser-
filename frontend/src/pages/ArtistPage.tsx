import HeroArtist from "../components/artist/HeroArtist";
import CreateRecordRelease from "../components/artist/CreateRecordRelease";
import StepsOverview from "../components/artist/StepsOverview";
import HowItWorksList from "../components/artist/HowItWorksList";
import TapIntoNetwork from "../components/artist/TapIntoNetwork";
import { usePageMeta } from "../hooks/usePageMeta";

export default function ArtistPage() {
  usePageMeta({
    title: "Sniser — Money For Your Music",
    description:
      "Bring the talent, we bring the booking. Sniser handles releases, production, and fan-owned content on the blockchain so artists get paid fairly.",
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
