import { z } from "zod";

export const createListingBodySchema = z.object({
  purchaseId: z.string().uuid(),
  price: z.coerce
    .number()
    .min(0.01, "Price must be at least 0.01")
    .max(100_000),
});

export const listingIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type CreateListingBody = z.infer<typeof createListingBodySchema>;
