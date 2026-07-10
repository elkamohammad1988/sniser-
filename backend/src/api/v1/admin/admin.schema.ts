import { z } from "zod";

const page = z.coerce.number().int().min(1).default(1);
const pageSize = z.coerce.number().int().min(1).max(100).default(25);

export const usersQuerySchema = z.object({
  role: z.enum(["all", "viewer", "artist", "admin"]).default("all"),
  status: z.enum(["all", "active", "suspended"]).default("all"),
  q: z.string().trim().max(120).optional(),
  page,
  pageSize,
});

export const updateUserBodySchema = z
  .object({
    role: z.enum(["viewer", "artist", "admin"]).optional(),
    status: z.enum(["active", "suspended"]).optional(),
  })
  .refine((v) => v.role !== undefined || v.status !== undefined, {
    message: "Provide role and/or status",
  });

export const ticketsQuerySchema = z.object({
  status: z.enum(["all", "open", "in_progress", "closed"]).default("all"),
  page,
  pageSize,
});

export const updateTicketBodySchema = z.object({
  status: z.enum(["open", "in_progress", "closed"]),
});

export const auditQuerySchema = z.object({
  action: z.string().trim().max(60).optional(),
  page,
  pageSize,
});

export const idParamSchema = z.object({ id: z.string().uuid() });
