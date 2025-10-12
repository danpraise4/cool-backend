import { NextFunction, Response } from "express";
import StatusCodes from "http-status";
import { RequestType } from "../../shared/helper/helper";
import AppException from "../../infastructure/https/exception/app.exception";
import httpStatus from "http-status";
import { FacilitiesService } from "./facilities.services";
import pick from "../../shared/helper/pick";

export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  public getAllFacilities = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const material: string | undefined = req.query.material as string;
      const params: any = pick(req.query, ["Latitude", "Longitude"]);

      const facilities = await this.facilitiesService.getFacilities({
        materialId: material,
        Latitude: params.Latitude as string,
        Longitude: params.Longitude as string,
      });

      res.status(StatusCodes.OK).json({
        message: "Facilities fetched successfully",
        status: "success",
        data: facilities.payload.items,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public getFacilityById = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const facility = await this.facilitiesService.getFacilityById(
        req.params.id
      );

      res.status(StatusCodes.OK).json({
        message: "Facility fetched successfully",
        status: "success",
        data: facility,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };
}
