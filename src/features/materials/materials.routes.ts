
import { Router } from "express";
import { isUserAuthenticated } from "../../infastructure/https/middlewares/auth.user.middleware";
import { materialsController } from "../../infastructure/https/controller/controller.module";
import validate from "../../infastructure/https/validation/app.validate";
import { getMaterialsValidator } from "./materials.validator";

const router = Router();

router.route("/").get(isUserAuthenticated, materialsController.getAllMaterials);
router.route("/:id").get(isUserAuthenticated, validate(getMaterialsValidator), materialsController.getMaterialsById);

export default router;
