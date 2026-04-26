import dotenv from "dotenv";
dotenv.config();

import * as Yup from "yup";

const envSchema = Yup.object()
  .shape({
    NODE_ENV: Yup.string()
      .required()
      .oneOf(["development", "production", "test", "staging"]),
    PORT: Yup.string().default("8000").required(),
    ENVIRONMENT: Yup.string().default("staging"),
    DATABASE_URL: Yup.string().label(" Database URL"),
    APP_NAME: Yup.string().required().label("App Name").default("Recycool"),
    JWT_ACCESS_TOKEN_EXPIRES: Yup.string()
      .default("1h")
      .label("JWT Access Token Expires")
      .required(),
    JWT_REFRESH_TOKEN_EXPIRES: Yup.string()
      .default("24h")
      .label("JWT Refresh Token Expires")
      .required(),

    SENDGRID_API_KEY: Yup.string()
      .required()
      .label("SendGrid API Key")
      .required(),
    SENDGRID_FROM_EMAIL: Yup.string()
      .required()
      .label("SendGrid From Email")
      .required(),
    AZURE_BLOB_CONNECTION_STRING: Yup.string().default(""),
    AZURE_BLOB_CONTAINER_NAME: Yup.string().default(""),
    CLOUDINARY_CLOUD_NAME: Yup.string().required().label("Cloudinary Cloud Name"),
    CLOUDINARY_API_KEY: Yup.string().required().label("Cloudinary API Key"),
    CLOUDINARY_API_SECRET: Yup.string().required().label("Cloudinary API Secret"),
    CLOUDINARY_UPLOAD_PRESET: Yup.string().default(""),

    REDIS_HOST: Yup.string().required().label("Redis Host"),
    REDIS_PORT: Yup.string().required().label("Redis Port"),
    REDIS_URL: Yup.string().required().label("Redis URL"),
    REDIS_PASSWORD: Yup.string().required().label("Redis Password"),
    REDIS_USER: Yup.string().required().label("Redis Username"),

    GOOGLE_CLIENT_ID: Yup.string().required().label("Google Client ID"),
    GOOGLE_CLIENT_SECRET: Yup.string().required().label("Google Client Secret"),
    GOOGLE_REDIRECT_URI: Yup.string().required().label("Google Redirect URI"),
    GOOGLE_API_KEY: Yup.string().required().label("Google API Key"),

    TWILIO_ACCOUNT_SID: Yup.string().required().label("Twilio Account SID"),
    TWILIO_AUTH_TOKEN: Yup.string().required().label("Twilio Auth Token"),
    TWILIO_PHONE_NUMBER: Yup.string().required().label("Twilio Phone Number"),

    FLUTTERWAVE_SECRET_KEY: Yup.string()
      .required()
      .label("Flutterwave Secret Key"),
    FLUTTERWAVE_PUBLIC_KEY: Yup.string()
      .required()
      .label("Flutterwave Public Key"),
    FLUTTERWAVE_ENCRYPTION_KEY: Yup.string()
      .required()
      .label("Flutterwave Encryption Key"),

    RESEND_API_KEY: Yup.string().required().label("Resend API Key"),

    /** Comma-separated origins for browser clients; use * for native apps only. */
    CORS_ORIGIN: Yup.string().optional().default("*"),
    /** Max failed requests per IP per window (production rate limit under /api). */
    API_RATE_LIMIT_MAX: Yup.string().optional().default("400"),
  })
  .unknown();

let envVars: Yup.InferType<typeof envSchema>;
try {
  envVars = envSchema.validateSync(process.env, {
    strict: true,
    abortEarly: true,
    stripUnknown: true,
  });
} catch (error) {
  if (error instanceof Error) {
    throw new Error(`Config validation error: ${error.message}`);
  } else {
    throw error;
  }
}

const config = {
  // App Config
  PORT: envVars.PORT,
  APP_NAME: envVars.APP_NAME,

  // Environment Config
  NODE_ENV: envVars.NODE_ENV,
  ENVIRONMENT: envVars.ENVIRONMENT,

  REDIS: {
    host: envVars.REDIS_HOST,
    port: parseInt(envVars.REDIS_PORT || "6379"),
    password: envVars.REDIS_PASSWORD,
    username: envVars.REDIS_USER,
    url: envVars.REDIS_URL,
  },

  AZURE_BLOB: {
    CONNECTION_STRING: envVars.AZURE_BLOB_CONNECTION_STRING,
    CONTAINER_NAME: envVars.AZURE_BLOB_CONTAINER_NAME,
  },
  CLOUDINARY: {
    CLOUD_NAME: envVars.CLOUDINARY_CLOUD_NAME,
    API_KEY: envVars.CLOUDINARY_API_KEY,
    API_SECRET: envVars.CLOUDINARY_API_SECRET,
    UPLOAD_PRESET: envVars.CLOUDINARY_UPLOAD_PRESET,
  },

  // Database Config
  DATABASE_URL: envVars.DATABASE_URL,

  // JWT Config
  JWT_ACCESS_TOKEN_EXPIRES: envVars.JWT_ACCESS_TOKEN_EXPIRES,
  JWT_REFRESH_TOKEN_EXPIRES: envVars.JWT_REFRESH_TOKEN_EXPIRES,

  // Mail Config
  SENDGRID_API_KEY: envVars.SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL: envVars.SENDGRID_FROM_EMAIL,

  // Google Auth Config
  GOOGLE: {
    CLIENT_ID: envVars.GOOGLE_CLIENT_ID,
    CLIENT_SECRET: envVars.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI: envVars.GOOGLE_REDIRECT_URI,
    API_KEY: envVars.GOOGLE_API_KEY,
  },

  TWILIO: {
    accountSid: envVars.TWILIO_ACCOUNT_SID,
    authToken: envVars.TWILIO_AUTH_TOKEN,
    phoneNumber: envVars.TWILIO_PHONE_NUMBER,
  },

  FLUTTERWAVE: {
    SECRET_KEY: envVars.FLUTTERWAVE_SECRET_KEY,
    PUBLIC_KEY: envVars.FLUTTERWAVE_PUBLIC_KEY,
    ENCRYPTION_KEY: envVars.FLUTTERWAVE_ENCRYPTION_KEY,
  },

  RESEND: {
    API_KEY: envVars.RESEND_API_KEY,
  },

  CORS_ORIGIN: envVars.CORS_ORIGIN || "*",
  API_RATE_LIMIT_MAX: Math.max(
    20,
    parseInt(String(envVars.API_RATE_LIMIT_MAX || "400"), 10) || 400
  ),
};

export default config;
