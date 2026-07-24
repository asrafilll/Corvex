import type { StorageConfig } from "@repo/storage";
import type { TelemetryConfig, TelemetryExporter } from "@repo/telemetry";
import { z } from "zod";

export type RuntimeEnv = "development" | "test" | "production";
export type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";

const defaultClientOrigins = "http://localhost:3000";
const defaultDatabaseUrl = "postgresql://postgres:postgres@localhost:15432/corvex?schema=public";
const defaultAppPasswordHash =
  "scrypt$Y29ydmV4LWRldi1zYWx0IQ$M6irG4c6XtX2Ri7KoOXCDEvwGFfiUOve78LuH9UlSJF1KznGiQpecgof3sBLe1lz7XeA4ubdifcaBYMcvXWQhA";
const defaultAppSessionSecret = "corvex-development-session-secret";
const defaultSecretsEncryptionKey =
  "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
const productionSecretMinimumLength = 32;

const runtimeEnvSchema = z.enum(["development", "test", "production"]).default("development");
const logLevelSchema = z
  .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
  .default("info");
const telemetryExporterSchema = z.enum(["console", "otlp"]).default("console");
const optionalStringSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional(),
);
const booleanSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalizedValue)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalizedValue)) {
    return false;
  }

  return value;
}, z.boolean());

const serverEnvSchema = z
  .object({
    NODE_ENV: runtimeEnvSchema,
    API_PORT: z.coerce.number().int().positive().default(8000),
    APP_PASSWORD_HASH: optionalStringSchema,
    APP_SESSION_SECRET: optionalStringSchema,
    CLIENT_ORIGINS: z.string().trim().min(1).default(defaultClientOrigins),
    DATABASE_URL: z.string().trim().min(1).default(defaultDatabaseUrl),
    ENABLE_TELEMETRY: booleanSchema.default(false),
    LOG_LEVEL: logLevelSchema,
    REDIS_URL: z.string().trim().min(1).default("redis://localhost:16379"),
    SECRETS_ENCRYPTION_KEY: z.string().trim().min(1).default(defaultSecretsEncryptionKey),
    TELEMETRY_API_KEY: optionalStringSchema,
    TELEMETRY_API_KEY_HEADER: z.string().trim().min(1).default("authorization"),
    TELEMETRY_EXPORTER: telemetryExporterSchema,
    TELEMETRY_EXPORTER_OTLP_ENDPOINT: optionalStringSchema,
    TELEMETRY_SERVICE_NAMESPACE: optionalStringSchema,
  })
  .superRefine((env, context) => {
    const appPasswordHash = env.APP_PASSWORD_HASH ?? defaultAppPasswordHash;
    const appSessionSecret = env.APP_SESSION_SECRET ?? defaultAppSessionSecret;

    if (!isScryptPasswordHash(appPasswordHash)) {
      context.addIssue({
        code: "custom",
        message: "APP_PASSWORD_HASH must be a valid Corvex scrypt hash.",
        path: ["APP_PASSWORD_HASH"],
      });
    }

    if (env.NODE_ENV !== "production") {
      return;
    }

    if (appPasswordHash === defaultAppPasswordHash) {
      context.addIssue({
        code: "custom",
        message: "APP_PASSWORD_HASH must be changed in production.",
        path: ["APP_PASSWORD_HASH"],
      });
    }

    if (appSessionSecret === defaultAppSessionSecret) {
      context.addIssue({
        code: "custom",
        message: "APP_SESSION_SECRET must be changed in production.",
        path: ["APP_SESSION_SECRET"],
      });
    }

    if (appSessionSecret.length < productionSecretMinimumLength) {
      context.addIssue({
        code: "custom",
        message: `APP_SESSION_SECRET must be at least ${productionSecretMinimumLength} characters in production.`,
        path: ["APP_SESSION_SECRET"],
      });
    }

    if (env.SECRETS_ENCRYPTION_KEY === defaultSecretsEncryptionKey) {
      context.addIssue({
        code: "custom",
        message: "SECRETS_ENCRYPTION_KEY must be changed in production.",
        path: ["SECRETS_ENCRYPTION_KEY"],
      });
    }

    if (!is32ByteKey(env.SECRETS_ENCRYPTION_KEY)) {
      context.addIssue({
        code: "custom",
        message: "SECRETS_ENCRYPTION_KEY must be 32 bytes encoded as hex or base64.",
        path: ["SECRETS_ENCRYPTION_KEY"],
      });
    }
  });

const storageEnvSchema = z.object({
  S3_ACCESS_KEY_ID: z.string().trim().min(1),
  S3_BUCKET: z.string().trim().min(1),
  S3_ENDPOINT: optionalStringSchema,
  S3_FORCE_PATH_STYLE: booleanSchema.default(true),
  S3_PUBLIC_BASE_URL: optionalStringSchema,
  S3_REGION: z.string().trim().min(1).default("auto"),
  S3_SECRET_ACCESS_KEY: z.string().trim().min(1),
});

export function parseServerEnv(environment: NodeJS.ProcessEnv) {
  return serverEnvSchema.parse(environment);
}

export const env = parseServerEnv(process.env);

export const appConfig = {
  nodeEnv: env.NODE_ENV,
  isProduction: env.NODE_ENV === "production",
} as const;

export const apiConfig = {
  port: env.API_PORT,
  clientOrigins: parseCsv(env.CLIENT_ORIGINS),
} as const;

export const appPasswordConfig = {
  passwordHash: env.APP_PASSWORD_HASH ?? defaultAppPasswordHash,
  sessionSecret: env.APP_SESSION_SECRET ?? defaultAppSessionSecret,
} as const;

export const databaseConfig = {
  url: env.DATABASE_URL,
} as const;

export const redisConfig = {
  url: env.REDIS_URL,
} as const;

export const secretsConfig = {
  encryptionKey: env.SECRETS_ENCRYPTION_KEY,
} as const;

export const loggerConfig = {
  environment: env.NODE_ENV,
  level: env.LOG_LEVEL,
} as const;

export const telemetryConfig = {
  apiKey: env.TELEMETRY_API_KEY,
  apiKeyHeader: env.TELEMETRY_API_KEY_HEADER,
  enabled: env.ENABLE_TELEMETRY,
  environment: env.NODE_ENV,
  exporter: env.TELEMETRY_EXPORTER as TelemetryExporter,
  otlpEndpoint: env.TELEMETRY_EXPORTER_OTLP_ENDPOINT,
  serviceNamespace: env.TELEMETRY_SERVICE_NAMESPACE,
} satisfies TelemetryConfig;

export function getStorageConfig(): StorageConfig {
  const storageEnv = storageEnvSchema.parse(process.env);

  return {
    accessKeyId: storageEnv.S3_ACCESS_KEY_ID,
    bucket: storageEnv.S3_BUCKET,
    endpoint: storageEnv.S3_ENDPOINT,
    forcePathStyle: storageEnv.S3_FORCE_PATH_STYLE,
    publicBaseUrl: storageEnv.S3_PUBLIC_BASE_URL,
    region: storageEnv.S3_REGION,
    secretAccessKey: storageEnv.S3_SECRET_ACCESS_KEY,
  };
}

function parseCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function is32ByteKey(value: string) {
  return Buffer.from(value, "hex").length === 32 || Buffer.from(value, "base64").length === 32;
}

function isScryptPasswordHash(value: string) {
  const [algorithm, encodedSalt, encodedHash, extra] = value.split("$");

  if (algorithm !== "scrypt" || !encodedSalt || !encodedHash || extra !== undefined) {
    return false;
  }

  try {
    return (
      Buffer.from(encodedSalt, "base64url").length >= 16 &&
      Buffer.from(encodedHash, "base64url").length === 64
    );
  } catch {
    return false;
  }
}
