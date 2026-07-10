import { m } from "framer-motion";
import Button from "../shared/Button";
import Container from "../layout/Container";
import { ArrowDown } from "../shared/Icons";
import { ViewerHeroIllustration } from "../shared/Illustrations";
import { EASE_SOFT } from "../../lib/motion/variants";

export default function HeroViewer() {
  const scrollToSteps = () => {
    document.getElementById("viewer-steps")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="bg-brand-green text-bg overflow-hidden">
      <Container>
        <div className="py-14 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <m.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE_SOFT }}
            >
              <h1 className="text-hero font-extrabold text-bg text-balance">
                How to View Content
                <br />
                on Sniser
              </h1>
              <p className="mt-5 max-w-md text-bg/80 leading-relaxed text-sm sm:text-base text-pretty">
                Buy access to unlock exclusive Sniser content and own the rights permanently in your digital wallet. Trade on the marketplace whenever you're ready to flip your seat — secure, transparent, and built for fans for the long haul.
              </p>
              <m.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25, ease: EASE_SOFT }}
                className="mt-7"
              >
                <Button
                  variant="light"
                  size="lg"
                  rightIcon={<ArrowDown className="h-4 w-4" />}
                  onClick={scrollToSteps}
                >
                  See How It Works
                </Button>
              </m.div>
            </m.div>

            <m.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.15, ease: EASE_SOFT }}
              className="group relative"
            >
              <div className="mx-auto max-w-md">
                <ViewerHeroIllustration tone="green" className="w-full h-auto" />
              </div>
            </m.div>
          </div>
        </div>
      </Container>
    </section>
  );
}
