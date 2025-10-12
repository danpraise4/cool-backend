
import { Router } from "express";
import { isUserAuthenticated } from "../../infastructure/https/middlewares/auth.user.middleware";
import { newsController } from "../../infastructure/https/controller/controller.module";
import validate from "../../infastructure/https/validation/app.validate";
import { getNewsValidator } from "./news.validator";

const router = Router();

router.route("/").get(isUserAuthenticated, newsController.getAllNews);
router.route("/:id").get(isUserAuthenticated, validate(getNewsValidator), newsController.getNews);

export default router;
