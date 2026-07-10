import { z } from "zod";

export const updateProfileBodySchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
});

export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>;
