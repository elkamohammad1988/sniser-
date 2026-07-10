import { Router } from "express";
import { healthController } from "./health.controller";
import { healthQuerySchema } from "./health.schema";
import { validate } from "../../../middleware/validate";

const router = Router();

router.get("/", validate({ query: healthQuerySchema }), healthController.get);

export default router;
