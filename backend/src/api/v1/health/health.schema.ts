import { z } from "zod";

export const healthQuerySchema = z.object({
  verbose: z
    .union([z.literal("true"), z.literal("false"), z.literal("1"), z.literal("0")])
    .optional()
    .transform((v) => v === "true" || v === "1"),
});

export type HealthQuery = z.infer<typeof healthQuerySchema>;
