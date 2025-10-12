import Joi from "joi";

export const createMaterialsValidator = {
  body: Joi.object().keys({
    description: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a description",
    }),
    title: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a title",
    }),
    images: Joi.array().items(Joi.string()).optional().messages({
      "any.required": "Oops!, you have to specify images",
    }),
  }),
};

export const getMaterialsValidator = {
  params: Joi.object().keys({
    id: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify an id",
    }),
  }),
};

export const updateMaterialsValidator = {
  params: Joi.object().keys({
    id: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify an id",
    }),
  }),
  body: Joi.object().keys({
    description: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a description",
    }),
    title: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a title",
    }),
    images: Joi.array().items(Joi.string()).optional().messages({
      "any.required": "Oops!, you have to specify images",
    }),
  }),
};
