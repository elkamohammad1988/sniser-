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
  return (
    <Section id="viewer-steps" tone="dark" spacing="md">
      <div className="flex flex-col gap-6">
        <ViewerStep
          number={1}
          variant="light"
          imageLeft={false}
          title="YOUR ACCOUNT"
          highlight="SIGN INTO"
          description={
            "Hit \"Start Session\" on the Sniser platform. You don't need to worry about seed phrases or complicated crypto setups. Just sign in to your Crossmint account using Google or Microsoft for a fast, secure login."
          }
          media={<SignInIllustration tone="light" className="w-full h-auto" />}
          callout="Crossmint instantly connects your wallet behind the scenes — zero crypto knowledge needed."
        />

        <ViewerStep
          number={2}
          variant="dark"
          imageLeft
          title="VERIFY YOUR ACCESS"
          highlight="WE"
          description="We handle the technical side. Sniser automatically checks that your connected Crossmint wallet holds the ownership rights to the content you're trying to view. It's a secure, transparent connection built entirely on the blockchain. Once ownership is verified, you're good to go."
          media={<VerifyAccessIllustration tone="dark" className="w-full h-auto" />}
          sideCard={<SecureMiniCard />}
          bullets={[
            "Account wallet connection",
            "Access ownership verified",
            "You're cleared",
          ]}
        />

        <ViewerStep
          number={3}
          variant="green"
          imageLeft={false}
          title="UNLOCKS AUTOMATICALLY"
          highlight="CONTENT"
          description={
            "No waiting rooms or download links. Once your access is confirmed by the network, the exclusive content unlocks instantly right on your screen. Just hit \"Play\" and enjoy the front-row view."
          }
          media={<ContentUnlocksIllustration tone="green" className="w-full h-auto" />}
          bullets={[
            "Access confirmed",
            "Content unlocked",
            "Enjoy your content",
          ]}
        />

        <ViewerStep
          number={4}
          variant="light"
          imageLeft
          title="ANYTIME, ANYWHERE"
          highlight="ENJOY"
          description="Your access isn't locked to a specific app or device — it stays attached to your wallet. Whether you're signed in on your phone or desktop, your content is always available wherever you sign in."
          media={<MultiDeviceIllustration tone="light" className="w-full h-auto" />}
          pills={[
            { label: "Anywhere", icon: <CheckIcon className="h-3.5 w-3.5" /> },
            { label: "Anytime", icon: <CheckIcon className="h-3.5 w-3.5" /> },
            { label: "Secure", icon: <ShieldIcon className="h-3.5 w-3.5" /> },
          ]}
        />

        <ViewerStep
          number={5}
          variant="dark"
          imageLeft={false}
          title="YOUR ACCESS ANYTIME"
          highlight="RESELL"
          description="Done watching? List your access rights on the Sniser Marketplace and sell them to another fan. The moment it sells, ownership and access seamlessly transfer to the new buyer. You get paid, the artist's smart contract automatically earns a royalty cut, and Sniser takes a standard commission."
          media={<ResellPhoneIllustration tone="dark" className="w-full h-auto" />}
          flow={[
            { label: "Your Access", icon: <LockIcon className="h-5 w-5" /> },
            { label: "Enters Marketplace", icon: <SwapIcon className="h-5 w-5" /> },
            { label: "Buyer", icon: <UsersIcon className="h-5 w-5" /> },
            { label: "Earn!", icon: <SparkIcon className="h-5 w-5" /> },
          ]}
        />
      </div>
    </Section>
  );
}
