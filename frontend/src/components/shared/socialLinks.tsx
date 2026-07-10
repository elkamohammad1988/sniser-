import { ComponentType, SVGProps } from "react";
import {
  InstagramIcon,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
} from "./Icons";
import { env } from "../../config/env";

export interface SocialLink {
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  href: string;
}

/**
 * Single source of truth for the brand's social profiles. Both the footer
 * cluster and the payment-row cluster render the same set, so any future
 * additions or icon changes only need to land here.
 */
export const SOCIAL_LINKS: SocialLink[] = [
  { label: "Instagram", Icon: InstagramIcon, href: env.social.instagram },
  { label: "Facebook", Icon: FacebookIcon, href: env.social.facebook },
  { label: "Twitter", Icon: TwitterIcon, href: env.social.twitter },
  { label: "LinkedIn", Icon: LinkedinIcon, href: env.social.linkedin },
];
