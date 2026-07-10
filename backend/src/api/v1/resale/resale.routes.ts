import { Router } from "express";
import { validate } from "../../../middleware/validate";
import { requireAuth } from "../../../middleware/auth";
import { createRateLimiter } from "../../../middleware/rateLimit";
import * as controller from "./resale.controller";
import { createListingBodySchema, listingIdParamSchema } from "./resale.schema";

const router = Router();
const tradeLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 30 });

router.get("/mine", requireAuth, controller.mine);
router.post("/", requireAuth, tradeLimiter, validate({ body: createListingBodySchema }), controller.create);
router.delete("/:id", requireAuth, validate({ params: listingIdParamSchema }), controller.cancel);
router.post("/:id/buy", requireAuth, tradeLimiter, validate({ params: listingIdParamSchema }), controller.buy);

export default router;
