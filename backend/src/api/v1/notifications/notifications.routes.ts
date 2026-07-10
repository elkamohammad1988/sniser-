import { Router } from "express";
import { validate } from "../../../middleware/validate";
import { requireAuth } from "../../../middleware/auth";
import * as controller from "./notifications.controller";
import { markReadBodySchema } from "./notifications.schema";

const router = Router();

router.get("/", requireAuth, controller.list);
router.post("/read", requireAuth, validate({ body: markReadBodySchema }), controller.markAsRead);

export default router;
