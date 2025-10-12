import Joi from "joi";

export const createNewsValidator = {
  body: Joi.object().keys({
    body: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a content",
    }),
    title: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a title",
    }),
    status: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a status",
    }),
    images: Joi.array().items(Joi.string()).optional().messages({
      "any.required": "Oops!, you have to specify images",
    }),
  }),
};

export const getNewsValidator = {
  params: Joi.object().keys({
    id: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify an id",
    }),
  }),
};

export const updateNewsValidator = {
  params: Joi.object().keys({
    id: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify an id",
    }),
  }),
  body: Joi.object().keys({
    content: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a content",
    }),
  }),
  images: Joi.array().items(Joi.string()).optional().messages({
    "any.required": "Oops!, you have to specify images",
  }),
  title: Joi.string().required().messages({
    "any.required": "Oops!, you have to specify a title",
  }),
};