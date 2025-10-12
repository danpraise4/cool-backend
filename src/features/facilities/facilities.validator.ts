
import { FacilityDays } from "@prisma/client";
import Joi from "joi";

export const createFacilityValidator = {
  body: Joi.object().keys({
    description: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a description",
    }),
    name: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a title",
    }),
    images: Joi.array().items(Joi.string()).optional().messages({
      "any.required": "Oops!, you have to specify images",
    }),
    address: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify an address",
    }),
    phone: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a phone number",
    }),
    email: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify an email",
    }),
    latitude: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a latitude",
    }),
    
    longitude: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a longitude",
    }),
    materialsId: Joi.array().items(Joi.string()).required().messages({
      "any.required": "Oops!, you have to specify materials",
    }),
    days: Joi.array().items(Joi.string().valid(...Object.values(FacilityDays))).required().messages({
      "any.required": "Oops!, you have to specify days",
      "string.valid": "Days must be valid FacilityDays enum values"
    }),
    recyclingFee: Joi.number().required().messages({
      "any.required": "Oops!, you have to specify a recycling fee",
    }),
  }),
};

export const getFacilityValidator = {
  params: Joi.object().keys({
    id: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify an id",
    }),
  }),
};

export const updateFacilityValidator = {
  params: Joi.object().keys({
    id: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify an id",
    }),
  }),
  body: Joi.object().keys({
    description: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a description",
    }),
    name: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a title",
    }),
    images: Joi.array().items(Joi.string()).optional().messages({
      "any.required": "Oops!, you have to specify images",
    }),
    address: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify an address",
    }),
    phone: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a phone number",
    }),
    email: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify an email",
    }),
    latitude: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a latitude",
    }),
    longitude: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a longitude",
    }),
    materialsId: Joi.array().items(Joi.string()).required().messages({
      "any.required": "Oops!, you have to specify materials",
    }),
  }),
};
