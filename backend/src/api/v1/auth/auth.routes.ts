import { Router } from "express";
import { validate } from "../../../middleware/validate";
import { requireAuth } from "../../../middleware/auth";
import { strictLimiter } from "../../../middleware/rateLimit";
import * as controller from "./auth.controller";
import {
  signupBodySchema,
  loginBodySchema,
  verifyEmailBodySchema,
  forgotPasswordBodySchema,
  resetPasswordBodySchema,
  changePasswordBodySchema,
} from "./auth.schema";

const router = Router();

router.post("/signup", strictLimiter, validate({ body: signupBodySchema }), controller.signup);
router.post("/login", strictLimiter, validate({ body: loginBodySchema }), controller.login);
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout);

router.get("/me", requireAuth, controller.me);
router.post("/resend-verification", strictLimiter, requireAuth, controller.resendVerification);
router.post("/change-password", requireAuth, validate({ body: changePasswordBodySchema }), controller.changePassword);

router.post("/verify-email", validate({ body: verifyEmailBodySchema }), controller.verifyEmail);
router.post("/forgot-password", strictLimiter, validate({ body: forgotPasswordBodySchema }), controller.forgotPassword);
router.post("/reset-password", strictLimiter, validate({ body: resetPasswordBodySchema }), controller.resetPassword);

export default router;
