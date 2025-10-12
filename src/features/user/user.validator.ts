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
