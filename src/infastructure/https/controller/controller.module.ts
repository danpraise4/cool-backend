import AuthUserController from "../../../features/authentication/controller/auth.user.controller";
import AuthAdminController from "../../../features/authentication/controller/auth.admin.controller";
import { AuthUserService } from "../../../features/authentication/services/auth.user.services";
import { RecycleController } from "../../../features/recycle/recycle.controller";
import { RecycleService } from "../../../features/recycle/recycle.services";
import { UserController } from "../../../features/user/user.controller";
import { UserService } from "../../../features/user/user.services";
import WalletController from "../../../features/wallet/wallet.controller";
import { WalletService } from "../../../features/wallet/wallet.services";
import { AuthAdminService } from "../../../features/authentication/services/auth.admin.service";
import { NewsController } from "../../../features/news/news.controller";
import { NewsService } from "../../../features/news/news.services";
import { MaterialsService } from "../../../features/materials/materials.services";
import { MaterialsController } from "../../../features/materials/materials.controller";
import { MarketController } from "../../../features/market/controller/market.user.controller";
import MarketUserService from "../../../features/market/services/market.user.service";
import LocationService from "../../../shared/services/location.service";
import { FacilitiesController } from "../../../features/facilities/facilities.controller";
import { FacilitiesService } from "../../../features/facilities/facilities.services";
import { CommunityService } from "../../../features/community/community.services";
import { CommunityController } from "../../../features/community/community.controller";

// Auth Controller
export const authUserController = new AuthUserController(
  new AuthUserService(),
  new LocationService(),
  new UserService()
);
export const authAdminController = new AuthAdminController(
  new AuthAdminService()
);

// User Controller
export const userController = new UserController(new UserService());

// Community Controller
export const communityController = new CommunityController(
  new CommunityService()
);

// News Controller
export const newsController = new NewsController(new NewsService());

// Materials Controller
export const materialsController = new MaterialsController(
  new MaterialsService()
);

// Facilities Controller
export const facilitiesController = new FacilitiesController(
  new FacilitiesService()
);

// Wallet Controller
export const walletController = new WalletController(new WalletService());

// Market User Controller
export const marketUserController = new MarketController(
  new MarketUserService()
);

// Recycle Controller
export const recycleController = new RecycleController(new RecycleService());
