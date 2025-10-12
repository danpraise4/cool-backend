/* eslint-disable @typescript-eslint/no-explicit-any */
import {  Response, NextFunction } from "express";

import StatusCodes from "http-status";
import AppException from "../exception/app.exception";
import TokenService from "../../../shared/services/token.service";
import { UserService } from "../../../features/user/user.services";
import { RequestType } from "../../../shared/helper/helper";


export const isUserAuthenticated = async (
  req: RequestType,
  _res: Response,
  next: NextFunction
) => {
  try {
    const _noAuth = () =>
      next(
        new AppException(
          `Oops!, you are not authenticated, login`,
          StatusCodes.UNAUTHORIZED
        )
      );

    const { authorization } = req.headers;
    const _authHeader = authorization;


    if (!_authHeader) return _noAuth();
    const [id, token] = _authHeader.split(" ");
    if (!id || !token) return _noAuth();
    if (id.trim().toLowerCase() !== "bearer") return _noAuth();
    const decodedToken = await new TokenService().verifyToken(token);
    const { sub, type }: any = decodedToken;
    if (type === "refresh")
      return next(
        new AppException("Oops!, wrong token type", StatusCodes.FORBIDDEN)
      );
    const user = await new UserService().getUserById(sub);
    if (!user)
      return next(
        new AppException("Oops!, user does not exist", StatusCodes.NOT_FOUND)
      );

    req.user = user;
    next();
  } catch (err: any) {
    return next(
      new AppException(err.message, err.status || StatusCodes.UNAUTHORIZED)
    );
  }
};
