import Joi from "joi";

export const sendTestEmailValidator = {
  body: Joi.object({
    emails: Joi.array()
      .items(Joi.string().email().lowercase().trim())
      .min(1)
      .max(10)
      .required()
      .messages({
        "any.required": "Provide at least one email in emails[]",
        "array.min": "Provide at least one email",
        "array.max": "Maximum 10 emails per request",
      }),
    subject: Joi.string().trim().max(200).optional(),
    message: Joi.string().trim().max(2000).optional(),
  }),
};
