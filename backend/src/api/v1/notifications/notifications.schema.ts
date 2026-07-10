import { z } from "zod";

export const markReadBodySchema = z.object({
  ids: z.array(z.string().uuid()).max(200).optional(),
});

export type MarkReadBody = z.infer<typeof markReadBodySchema>;
