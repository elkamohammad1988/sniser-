import { z } from "zod";

export const contactBodySchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  topic: z.enum(["advertise", "support", "press", "general"]),
  message: z.string().trim().min(10, "Message is too short").max(2000),
  /** Honeypot — accepted but must stay empty; the service silently drops
   *  submissions where it is filled (bots fill it; humans never see it). */
  website: z.string().max(200).optional(),
});

export type ContactBody = z.infer<typeof contactBodySchema>;
