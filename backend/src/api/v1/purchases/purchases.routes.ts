import { Router } from "express";
import { validate } from "../../../middleware/validate";
import { requireAuth } from "../../../middleware/auth";
import { createRateLimiter } from "../../../middleware/rateLimit";
import * as controller from "./purchases.controller";
import { purchaseBodySchema, contentIdParamSchema } from "./purchases.schema";

const router = Router();
const purchaseLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 30 });

router.get("/", requireAuth, controller.library);
router.post("/", requireAuth, purchaseLimiter, validate({ body: purchaseBodySchema }), controller.create);
router.get("/:contentId/access", requireAuth, validate({ params: contentIdParamSchema }), controller.access);

export default router;
