import { Router } from "express";
import { validate } from "../../../middleware/validate";
import { requireAuth } from "../../../middleware/auth";
import { createRateLimiter } from "../../../middleware/rateLimit";
import * as controller from "./wallet.controller";
import { depositBodySchema } from "./wallet.schema";

const router = Router();

// Slightly tighter limit on money movement than the default API limiter.
const depositLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 20 });

router.get("/", requireAuth, controller.summary);
router.get("/transactions", requireAuth, controller.transactions);
router.post("/deposit", requireAuth, depositLimiter, validate({ body: depositBodySchema }), controller.deposit);

export default router;
