import { RecycleChatType, RecycleScheduleType } from "@prisma/client";
import Joi from "joi";

export const createRecycleScheduleValidator = {
  body: Joi.object().keys({
    type: Joi.string().valid(RecycleScheduleType.PICKUP, RecycleScheduleType.DROP_OFF).required().messages({
      "any.required": "Oops!, you have to specify content",
      "any.only": "Content must be either 'pickup' or 'dropoff'"
    }),
    facilityId: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a facility",
    }),
    materialId: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a material",
    }),
    dates: Joi.array().items(
      Joi.string().pattern(/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/).required().messages({
        "string.pattern.base": "Date must be in DD-MM-YYYY format",
      })
    ).required().messages({
      "any.required": "Oops!, you have to specify dates",
      "array.base": "Dates must be an array",
    }),
    quantity: Joi.number().optional().messages({
      "any.required": "Oops!, you have to specify a quantity",
    }),
  }),
};

export const updateRecycleScheduleValidator = {
  body: Joi.object().keys({
    transactionStatus: Joi.number().required().messages({
      "any.required": "Oops!, you have to specify a transaction status",
    }),
    scheduledCollectionDate: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a scheduled collection date",
    }),
    quantity: Joi.number().optional().messages({
      "any.required": "Oops!, you have to specify a quantity",
    }),
    
  }),
};

export const getRecycleSchedulesSingleValidator = {
  params: Joi.object().keys({
    id: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify an id",
    }),
  }),
};

export const adminChatValidator = {
  body: Joi.object().keys({
    withID: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a user",
    }),
    userID: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a user",
    }),
    type: Joi.string().valid(RecycleChatType.WITH_FACILITY, RecycleChatType.WITH_SELLER).required().messages({
      "any.required": "Oops!, you have to specify a type",
      "any.only": "Type must be either 'with_facility' or 'with_seller'"
    }),
  }),
};

export const getRecycleSchedulesValidator = {
  query: Joi.object().keys({
    date: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a date",
    }),
  }),
};


export const createCommentValidator = {
  body: Joi.object().keys({
    content: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a content",
    }),
  }),
};
