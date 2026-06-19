import Joi from "joi";

export const updateUserValidator = {
  body: Joi.object().keys({
    firstName: Joi.string().optional().messages({
      "any.required": "Oops!, you have to specify a first name",
    }),
    lastName: Joi.string().optional().messages({
      "any.required": "Oops!, you have to specify a last name",
    }),
    phone: Joi.string().optional().messages({
      "any.required": "Oops!, you have to specify a phone number",
    }),
    address: Joi.string().optional().messages({
      "any.required": "Oops!, you have to specify an address",
    }),
  }),
};


export const uploadImageValidator = {
  body: Joi.object().keys({
    image: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify an image",
    }),
  }),
};

export const getNotificationsQueryValidator = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(50).optional(),
    unreadOnly: Joi.string().valid("true", "false").optional(),
  }),
};

export const notificationIdParamValidator = {
  params: Joi.object().keys({
    id: Joi.string().uuid().required().messages({
      "any.required": "Notification id is required",
      "string.guid": "Notification id must be a valid UUID",
    }),
  }),
};

export const submitRatingValidator = {
  body: Joi.object().keys({
    targetUserId: Joi.string().uuid().required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    review: Joi.string().trim().max(1000).optional().allow(""),
    contextType: Joi.string().valid("order", "charity").required(),
    contextId: Joi.string().uuid().required(),
  }),
};
