import { z } from "zod";
import { env } from "../../../config/env";

export const depositBodySchema = z.object({
  amount: z.coerce
    .number()
    .min(0.01, "Amount must be at least 0.01 USDC")
    .max(env.MAX_DEPOSIT, `Maximum top-up is ${env.MAX_DEPOSIT} USDC`),
});

export type DepositBody = z.infer<typeof depositBodySchema>;
