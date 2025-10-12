import Joi from "joi";

export const createProductValidator = {
  body: Joi.object().keys({
    title: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a title",
    }),
    description: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a description",
    }),
    price: Joi.number().optional().messages({
      "any.required": "Oops!, you have to specify a price",
    }),
    media: Joi.array().items(Joi.string()).optional().messages({
      "any.required": "Oops!, you have to specify images",
    }),
    type: Joi.string().optional().messages({
      "any.required": "Oops!, you have to specify a product type",
    }),
    material: Joi.any().required().messages({
      "any.required": "Oops!, you have to specify a material",
    }),
  }),
};

export const updateProductValidator = {
  params: Joi.object().keys({
    id: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify an id",
    }),
  }),
  body: Joi.object().keys({
    title: Joi.string().optional().messages({
      "any.required": "Oops!, you have to specify a title",
    }),
    description: Joi.string().optional().messages({
      "any.required": "Oops!, you have to specify a description",
    }),
    price: Joi.number().optional().messages({
      "any.required": "Oops!, you have to specify a price",
    }),
    newImages: Joi.array().items(Joi.string()).optional().messages({
      "any.required": "Oops!, you have to specify images",
    }),
    removeImages: Joi.array().items(Joi.string()).optional().messages({
      "any.required": "Oops!, you have to specify images",
    }),
    type: Joi.string().optional().messages({
      "any.required": "Oops!, you have to specify a type",
    }),
    material: Joi.any().optional().messages({
      "any.required": "Oops!, you have to specify a material",
    }),
  }),
};

export const deleteProductValidator = {
  params: Joi.object().keys({
    id: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify an id",
    }),
  }),
};

export const respondToCharityProductRequestValidator = {
  params: Joi.object().keys({
    id: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify an id",
    }),
  }),
  body: Joi.object().keys({
    status: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a status",
    }),
  }),
};

export const productValidator = {
  params: Joi.object().keys({
    id: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify an id",
    }),
  }),
};
