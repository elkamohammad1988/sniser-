import { Router } from "express";
import { validate } from "../../../middleware/validate";
import { requireAuth } from "../../../middleware/auth";
import { uploadAvatar } from "../../../middleware/upload";
import * as controller from "./users.controller";
import { updateProfileBodySchema } from "./users.schema";

const router = Router();

router.get("/me", requireAuth, controller.account);
router.patch("/me", requireAuth, uploadAvatar, validate({ body: updateProfileBodySchema }), controller.updateProfile);

export default router;
