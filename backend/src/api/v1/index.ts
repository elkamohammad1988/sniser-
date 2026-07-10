import { Router } from "express";
import { sendOk } from "../../utils/ApiResponse";
import healthRoutes from "./health/health.routes";
import authRoutes from "./auth/auth.routes";
import catalogRoutes from "./catalog/catalog.routes";
import artistRoutes from "./artists/artists.routes";
import walletRoutes from "./wallet/wallet.routes";
import purchaseRoutes from "./purchases/purchases.routes";
import resaleRoutes from "./resale/resale.routes";
import contactRoutes from "./contact/contact.routes";
import notificationRoutes from "./notifications/notifications.routes";
import userRoutes from "./users/users.routes";
import adminRoutes from "./admin/admin.routes";

const v1 = Router();

v1.get("/", (_req, res) =>
  sendOk(res, {
    name: "Sniser API",
    version: "v1",
    resources: [
      "health",
      "auth",
      "users",
      "catalog",
      "artists",
      "wallet",
      "purchases",
      "resale",
      "contact",
      "notifications",
      "admin",
    ],
  })
);

v1.use("/health", healthRoutes);
v1.use("/auth", authRoutes);
v1.use("/users", userRoutes);
v1.use("/catalog", catalogRoutes);
v1.use("/artists", artistRoutes);
v1.use("/wallet", walletRoutes);
v1.use("/purchases", purchaseRoutes);
v1.use("/resale", resaleRoutes);
v1.use("/contact", contactRoutes);
v1.use("/notifications", notificationRoutes);
v1.use("/admin", adminRoutes);

export default v1;
