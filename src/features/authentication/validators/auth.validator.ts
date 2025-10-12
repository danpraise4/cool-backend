import Joi from "joi";

export const loginValidator = {
  body: Joi.object().keys({
    password: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a password",
    }),
    email: Joi.string().required().email().messages({
      "any.required":
        "Oops!, you have to specify an email address or phone number",
      "string.email": "Oops!, you have to specify a valid email address",
    }),
  }),
};

export const checkUserValidator = {
  body: Joi.object().keys({
    identifier: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify an email address or phone number",
    }),
  }),
};

export const verifyOtpValidator = {
  body: Joi.object().keys({
    identifier: Joi.string().required().messages({
      "any.required":
        "Oops!, you have to specify an email address or phone number",
    }),
    otp: Joi.string().length(6).required().messages({
      "any.required": "Oops!, you have to specify an OTP",
      "string.length": "Oops!, OTP must be exactly 6 digits",
    }),
  }),
};

export const resendOtpValidator = {
  body: Joi.object().keys({
    identifier: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify an email address or phone number",
    }),
  }),
};
export const registerCompleteValidator = {
  body: Joi.object().keys({
    token: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a token",
    }),

    identifier: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify an email address",
    }),

    phone: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a phone number",
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

    address: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify an address",
    }),

    latitude: Joi.number().required().messages({
      "any.required": "Oops!, you have to specify a latitude",
    }),

    longitude: Joi.number().required().messages({
      "any.required": "Oops!, you have to specify a longitude",
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

export const updateSettingsValidator = {
  body: Joi.object().keys({
    isEmailNotificationsEnabled: Joi.boolean().optional().messages({
      "any.required":
        "Oops!, you have to specify if email notifications are enabled",
    }),
    isSmsNotificationsEnabled: Joi.boolean().optional().messages({
      "any.required":
        "Oops!, you have to specify if sms notifications are enabled",
    }),
    isPushNotificationsEnabled: Joi.boolean().optional().messages({
      "any.required":
        "Oops!, you have to specify if push notifications are enabled",
    }),
  }),
};

export const resetPasswordValidator = {
  body: Joi.object().keys({
    email: Joi.string().email().required().messages({
      "any.required": "Oops!, you have to specify an email address",
    }),
  }),
};

export const verifyResetPasswordValidator = {
  body: Joi.object().keys({
    email: Joi.string().email().required().messages({
      "any.required": "Oops!, you have to specify an email address",
    }),
    otp: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify an OTP",
    }),
  }),
};

export const resetPasswordUpdateValidator = {
  body: Joi.object().keys({
    password: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a password",
    }),
    passwordConfirmation: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a password confirmation",
    }),
    token: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a token",
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

export const updateDeviceValidator = {
  body: Joi.object().keys({
    deviceToken: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a device token",
    }),
  }),
};

export const googleAuthValidator = {
  body: Joi.object().keys({
    token: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify a token",
    }),
  }),
};

export const getLocationValidator = {
  body: Joi.object().keys({
    ip: Joi.string().required().messages({
      "any.required": "Oops!, you have to specify an IP address",
    }),
  }),
};

export const getCititiesfromLatLongValidator = {
  query: Joi.object().keys({
    lat: Joi.number().required().messages({
      "any.required": "Oops!, you have to specify a latitude",
    }),
    long: Joi.number().required().messages({
      "any.required": "Oops!, you have to specify a longitude",
    }),
  }),
};


