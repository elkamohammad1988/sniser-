import { Router } from "express";
import { validate } from "../../../middleware/validate";
import { optionalAuth } from "../../../middleware/auth";
import * as controller from "./catalog.controller";
import { listQuerySchema, slugParamSchema } from "./catalog.schema";

const router = Router();

router.get("/", validate({ query: listQuerySchema }), controller.list);
router.get("/categories", controller.categories);
router.get("/trending", controller.trending);
router.get("/:slug", validate({ params: slugParamSchema }), optionalAuth, controller.detail);

export default router;
