const dotenv = require("dotenv");
const Joi = require("joi");

// Load environment variables
dotenv.config();

// Define validation schema
const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().port().default(3001),
  MONGODB_URI: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default("7d"),
  CLIENT_URL: Joi.string().uri().default("http://localhost:5173"),
  COMPANY_NAME: Joi.string().default("Moiz Medical Store POS"),
  COMPANY_ADDRESS: Joi.string().default("123 Medical Street"),
  COMPANY_PHONE: Joi.string().default("+1234567890"),
  COMPANY_EMAIL: Joi.string().email().default("info@medicalstore.com"),
}).unknown();

// Validate environment variables
const { error, value: env } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  mongoose: {
    url: env.MONGODB_URI,
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },
  jwt: {
    secret: env.JWT_SECRET,
    accessExpirationTime: env.JWT_EXPIRES_IN,
  },
  client: {
    url: env.CLIENT_URL,
  },
  company: {
    name: env.COMPANY_NAME,
    address: env.COMPANY_ADDRESS,
    phone: env.COMPANY_PHONE,
    email: env.COMPANY_EMAIL,
  },
  cors: {
    origin: env.CLIENT_URL,
    credentials: true,
    optionsSuccessStatus: 200,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  authRateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth requests per windowMs
  },
};

module.exports = config;
