import { Router } from "express";

import { facilitiesController } from "../../infastructure/https/controller/controller.module";
import validate from "../../infastructure/https/validation/app.validate";
import { getFacilityValidator } from "./facilities.validator";
import { isUserAuthenticated } from "../../infastructure/https/middlewares/auth.user.middleware";

const router = Router();

router.route("/").get(facilitiesController.getAllFacilities);

router
  .route("/:id")
  .get(
    isUserAuthenticated,
    validate(getFacilityValidator),
    facilitiesController.getFacilityById
  );

export default router;
