import { Router } from "express";
import { validate } from "../../../middleware/validate";
import { optionalAuth } from "../../../middleware/auth";
import { strictLimiter } from "../../../middleware/rateLimit";
import * as controller from "./contact.controller";
import { contactBodySchema } from "./contact.schema";

const router = Router();

router.post("/", strictLimiter, optionalAuth, validate({ body: contactBodySchema }), controller.submit);

export default router;
