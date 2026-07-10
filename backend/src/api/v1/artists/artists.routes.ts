import { Router } from "express";
import { validate } from "../../../middleware/validate";
import { requireAuth, requireRole } from "../../../middleware/auth";
import { uploadRelease, uploadAvatar } from "../../../middleware/upload";
import * as controller from "./artists.controller";
import {
  applyArtistBodySchema,
  updateArtistBodySchema,
  createContentBodySchema,
  updateContentBodySchema,
  statusBodySchema,
  myContentQuerySchema,
  handleParamSchema,
  contentIdParamSchema,
} from "./artists.schema";

const router = Router();
const artistOnly = [requireAuth, requireRole("artist")];

// Become an artist (any authenticated user).
router.post("/apply", requireAuth, validate({ body: applyArtistBodySchema }), controller.apply);

// Authenticated artist self-management.
router.get("/me", ...artistOnly, controller.me);
router.patch("/me", ...artistOnly, uploadAvatar, validate({ body: updateArtistBodySchema }), controller.updateProfile);
router.get("/me/dashboard", ...artistOnly, controller.dashboard);

router.get("/me/releases", ...artistOnly, validate({ query: myContentQuerySchema }), controller.listReleases);
router.post("/me/releases", ...artistOnly, uploadRelease, validate({ body: createContentBodySchema }), controller.createRelease);
router.patch(
  "/me/releases/:id",
  ...artistOnly,
  uploadRelease,
  validate({ params: contentIdParamSchema, body: updateContentBodySchema }),
  controller.updateRelease
);
router.post(
  "/me/releases/:id/status",
  ...artistOnly,
  validate({ params: contentIdParamSchema, body: statusBodySchema }),
  controller.setStatus
);
router.delete(
  "/me/releases/:id",
  ...artistOnly,
  validate({ params: contentIdParamSchema }),
  controller.deleteRelease
);

// Public artist profile (declared last so it never shadows /me routes).
router.get("/:handle", validate({ params: handleParamSchema }), controller.publicProfile);

export default router;
