import Joi from "joi";

export const loginValidator = {
  body: Joi.object().keys({
    password: Joi.string()
      .min(8)
      .pattern(
        new RegExp(
          "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})"
        )
      )
      .required()
      .messages({
        "string.pattern.base":
          "Oops!, password must be at least 8 characters long and must contain at least one uppercase letter, one lowercase letter, one number and one special character",
        "string.required": "Oops!, you have to specify a password",
      }),
    email: Joi.string().email().lowercase().required().messages({
      "any.required": "Oops!, you have to specify an email address",
    }),
  }),
};

export const registerValidator = {
  body: Joi.object().keys({
    phone: Joi.string()
      .required()
      .min(10)
      .pattern(/^[0-9]+$/)
      .messages({
        "any.required": "Oops!, you have to specify a phone number",
        "string.min": "Oops!, phone number must be at least 10 digits",
        "string.pattern.base": "Oops!, phone number must contain only numbers",
      }),
  }),
};

export const creditUserWalletValidator = {
  body: Joi.object().keys({
    user: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a user id",
    }),
    idempotent: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify an idempotent",
    }),
    amount: Joi.number().positive().required().messages({
      "any.required": "Oops!, you have to specify an amount",
      "number.positive": "Oops!, amount must be greater than 0",
    }),
  }),
};

export const verifyOtpValidator = {
  body: Joi.object().keys({
    phone: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a phone number",
    }),
    otp: Joi.string().length(6).required().messages({
      "any.required": "Oops!, you have to specify an OTP",
      "string.length": "Oops!, OTP must be exactly 4 digits",
    }),
  }),
};

export const completeRegistrationValidator = {
  body: Joi.object().keys({
    token: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a token",
    }),

    email: Joi.string().email().lowercase().required().messages({
      "any.required": "Oops!, you have to specify an email address",
    }),
    firstName: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a first name",
    }),

    lastName: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a last name",
    }),

    cityOfResidence: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a city of residence",
    }),

    confirmPassword: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a confirm password",
    }),

    password: Joi.string()
      .min(8)
      .pattern(
        new RegExp(
          "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})"
        )
      )
      .messages({
        "any.required": "Oops!, you have to specify a password",
        "string.min": "Password must be at least 8 characters long",
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character",
      }),
  }),
};

export const emailValidator = {
  body: Joi.object().keys({
    email: Joi.string().email().lowercase().required().messages({
      "any.required": "Oops!, you have to specify an email address",
    }),
  }),
};

export const updatePasswordValidator = {
  body: Joi.object().keys({
    oldPassword: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify an old password",
    }),
    password: Joi.string()
      .min(8)
      .pattern(
        new RegExp(
          "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})"
        )
      )
      .required()
      .messages({
        "any.required": "Oops!, you have to specify a password",
        "string.min": "Password must be at least 8 characters long",
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character",
      }),
    passwordConfirmation: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a password confirmation",
    }),
  }),
};
