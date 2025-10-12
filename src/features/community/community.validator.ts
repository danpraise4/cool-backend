import Joi from "joi";

export const createPostValidator = {
  body: Joi.object().keys({
    content: Joi.string().optional().allow(null),
    images: Joi.array().items(Joi.string()).optional().allow(null),
  }),
};

export const createCommentValidator = {
  body: Joi.object().keys({
    content: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a content",
    }),
  }),
};
