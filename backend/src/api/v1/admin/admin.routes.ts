import { Router } from "express";
import { validate } from "../../../middleware/validate";
import { requireAuth, requireRole } from "../../../middleware/auth";
import * as controller from "./admin.controller";
import {
  usersQuerySchema,
  updateUserBodySchema,
  ticketsQuerySchema,
  updateTicketBodySchema,
  auditQuerySchema,
  idParamSchema,
} from "./admin.schema";

const router = Router();
router.use(requireAuth, requireRole("admin"));

router.get("/stats", controller.stats);

router.get("/users", validate({ query: usersQuerySchema }), controller.users);
router.patch("/users/:id", validate({ params: idParamSchema, body: updateUserBodySchema }), controller.updateUser);

router.get("/tickets", validate({ query: ticketsQuerySchema }), controller.tickets);
router.patch("/tickets/:id", validate({ params: idParamSchema, body: updateTicketBodySchema }), controller.updateTicket);

router.get("/audit", validate({ query: auditQuerySchema }), controller.audit);

export default router;
