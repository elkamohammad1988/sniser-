import { z } from "zod";

export const purchaseBodySchema = z.object({
  contentId: z.string().uuid(),
});

export const contentIdParamSchema = z.object({
  contentId: z.string().uuid(),
});

export type PurchaseBody = z.infer<typeof purchaseBodySchema>;
