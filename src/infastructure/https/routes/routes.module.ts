import { Router } from "express";
import authRoutes from "../../../features/authentication/routes/auth.user.routes";
import userRoutes from "../../../features/user/user.routes";
import communityRoutes from "../../../features/community/community.routes";
import walletRoutes from "../../../features/wallet/wallet.routes";
import newsRoutes from "../../../features/news/news.routes";
import materialsRoutes from "../../../features/materials/materials.routes";
import marketRoutes from "../../../features/market/routes/market.user.routes";
import authAdminRoutes from "../../../features/authentication/routes/auth.admin.routes";
import facilitiesRoutes from "../../../features/facilities/facilities.routes";
import recycleRoutes from "../../../features/recycle/recycle.routes";
const router = Router();

const defaultRoutes = [
  { path: "/user", route: userRoutes },
  { path: "/news", route: newsRoutes },
  { path: "/wallet", route: walletRoutes },
  { path: "/market", route: marketRoutes },
  { path: "/auth/user", route: authRoutes },
  { path: "/auth/admin", route: authAdminRoutes },
  { path: "/materials", route: materialsRoutes },
  { path: "/community", route: communityRoutes },
  { path: "/facilities", route: facilitiesRoutes },
  { path: "/recycle", route: recycleRoutes },
];

defaultRoutes.forEach(({ path, route }) => {
  router.use(path, route);
});

export default router;
