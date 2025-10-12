import { NextFunction, Response } from "express";
import StatusCodes from "http-status";
import { RequestType } from "../../shared/helper/helper";
import { MaterialsService } from "./materials.services";
import AppException from "../../infastructure/https/exception/app.exception";
import httpStatus from "http-status";

export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  public getAllMaterials = async (
    _req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const materials = await this.materialsService.getMaterials();

      res.status(StatusCodes.OK).json({
        message: "Materials fetched successfully",
        data: materials,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public getMaterialsById = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const material = await this.materialsService.getMaterialsById(
        req.params.id
      );

      res.status(StatusCodes.OK).json({
        message: "Materials fetched successfully",
        data: material,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };
}
