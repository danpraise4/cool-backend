import Joi from "joi";

export const supportContactValidator = {
  body: Joi.object().keys({
    name: Joi.string().trim().min(1).max(120).required(),
    email: Joi.string().email().required(),
    subject: Joi.string().trim().min(1).max(200).required(),
    message: Joi.string().trim().min(10).max(5000).required(),
    type: Joi.string().valid("contact", "feedback", "report").required(),
    context: Joi.string().trim().max(5000).optional().allow(""),
  }),
};
