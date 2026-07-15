import { useTranslation } from "react-i18next";
import Section from "../layout/Section";
import ViewerStep from "./ViewerStep";
import SecureMiniCard from "./SecureMiniCard";
import {
  CheckIcon,
  ShieldIcon,
  LockIcon,
  SwapIcon,
  UsersIcon,
  SparkIcon,
} from "../shared/Icons";
import {
  SignInIllustration,
  VerifyAccessIllustration,
  ContentUnlocksIllustration,
  MultiDeviceIllustration,
  ResellPhoneIllustration,
} from "../shared/Illustrations";

export default function ViewerStepsList() {
  const { t } = useTranslation();
  return (
    <Section id="viewer-steps" tone="dark" spacing="md">
      <div className="flex flex-col gap-6">
        <ViewerStep
          number={1}
          variant="light"
          imageLeft={false}
          title={t("viewer.steps.step1.title")}
          highlight={t("viewer.steps.step1.highlight")}
          description={t("viewer.steps.step1.description")}
          media={<SignInIllustration tone="light" className="w-full h-auto" />}
          callout={t("viewer.steps.step1.callout")}
        />

        <ViewerStep
          number={2}
          variant="dark"
          imageLeft
          title={t("viewer.steps.step2.title")}
          highlight={t("viewer.steps.step2.highlight")}
          description={t("viewer.steps.step2.description")}
          media={<VerifyAccessIllustration tone="dark" className="w-full h-auto" />}
          sideCard={<SecureMiniCard />}
          bullets={[
            t("viewer.steps.step2.bullets.walletConnection"),
            t("viewer.steps.step2.bullets.ownershipVerified"),
            t("viewer.steps.step2.bullets.cleared"),
          ]}
        />

        <ViewerStep
          number={3}
          variant="green"
          imageLeft={false}
          title={t("viewer.steps.step3.title")}
          highlight={t("viewer.steps.step3.highlight")}
          description={t("viewer.steps.step3.description")}
          media={<ContentUnlocksIllustration tone="green" className="w-full h-auto" />}
          bullets={[
            t("viewer.steps.step3.bullets.accessConfirmed"),
            t("viewer.steps.step3.bullets.contentUnlocked"),
            t("viewer.steps.step3.bullets.enjoy"),
          ]}
        />

        <ViewerStep
          number={4}
          variant="light"
          imageLeft
          title={t("viewer.steps.step4.title")}
          highlight={t("viewer.steps.step4.highlight")}
          description={t("viewer.steps.step4.description")}
          media={<MultiDeviceIllustration tone="light" className="w-full h-auto" />}
          pills={[
            { label: t("viewer.steps.step4.pills.anywhere"), icon: <CheckIcon className="h-3.5 w-3.5" /> },
            { label: t("viewer.steps.step4.pills.anytime"), icon: <CheckIcon className="h-3.5 w-3.5" /> },
            { label: t("viewer.steps.step4.pills.secure"), icon: <ShieldIcon className="h-3.5 w-3.5" /> },
          ]}
        />

        <ViewerStep
          number={5}
          variant="dark"
          imageLeft={false}
          title={t("viewer.steps.step5.title")}
          highlight={t("viewer.steps.step5.highlight")}
          description={t("viewer.steps.step5.description")}
          media={<ResellPhoneIllustration tone="dark" className="w-full h-auto" />}
          flow={[
            { label: t("viewer.steps.step5.flow.yourAccess"), icon: <LockIcon className="h-5 w-5" /> },
            { label: t("viewer.steps.step5.flow.entersMarketplace"), icon: <SwapIcon className="h-5 w-5" /> },
            { label: t("viewer.steps.step5.flow.buyer"), icon: <UsersIcon className="h-5 w-5" /> },
            { label: t("viewer.steps.step5.flow.earn"), icon: <SparkIcon className="h-5 w-5" /> },
          ]}
        />
      </div>
    </Section>
  );
}
