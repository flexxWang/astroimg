const TRUE_VALUES = new Set(['true', '1', 'yes', 'on']);
const FALSE_VALUES = new Set(['false', '0', 'no', 'off', '']);

function readString(env: Record<string, unknown>, key: string, fallback?: string) {
  const raw = env[key];
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  if (fallback !== undefined) {
    return fallback;
  }
  throw new Error(`Missing required environment variable: ${key}`);
}

function readNumber(
  env: Record<string, unknown>,
  key: string,
  fallback?: number,
  options?: { min?: number; max?: number },
) {
  const raw = env[key];
  const maybeValue =
    typeof raw === 'string' && raw.trim() !== ''
      ? Number(raw)
      : fallback;

  if (!Number.isFinite(maybeValue)) {
    throw new Error(`Invalid number environment variable: ${key}`);
  }

  const value = maybeValue as number;

  if (options?.min !== undefined && value < options.min) {
    throw new Error(`${key} must be >= ${options.min}`);
  }

  if (options?.max !== undefined && value > options.max) {
    throw new Error(`${key} must be <= ${options.max}`);
  }

  return value;
}

function readBoolean(
  env: Record<string, unknown>,
  key: string,
  fallback = false,
) {
  const raw = env[key];

  if (typeof raw !== 'string') {
    return fallback;
  }

  const normalized = raw.trim().toLowerCase();
  if (TRUE_VALUES.has(normalized)) {
    return true;
  }
  if (FALSE_VALUES.has(normalized)) {
    return false;
  }

  throw new Error(`Invalid boolean environment variable: ${key}`);
}

export function validateEnv(env: Record<string, unknown>) {
  const validated = {
    NODE_ENV: readString(env, 'NODE_ENV', 'development').toLowerCase(),
    PORT: readNumber(env, 'PORT', 4000, { min: 1, max: 65535 }),
    LOG_LEVEL: readString(env, 'LOG_LEVEL', 'info'),
    TRUST_PROXY: readBoolean(env, 'TRUST_PROXY', false),
    CORS_ALLOWED_ORIGINS: readString(env, 'CORS_ALLOWED_ORIGINS', ''),
    COOKIE_DOMAIN:
      typeof env.COOKIE_DOMAIN === 'string' ? env.COOKIE_DOMAIN.trim() : '',
    COOKIE_SECURE: readBoolean(env, 'COOKIE_SECURE', false),
    COOKIE_SAME_SITE: readString(env, 'COOKIE_SAME_SITE', 'lax').toLowerCase(),
    DB_HOST: readString(env, 'DB_HOST', '127.0.0.1'),
    DB_PORT: readNumber(env, 'DB_PORT', 3306, { min: 1, max: 65535 }),
    DB_USER: readString(env, 'DB_USER', 'root'),
    DB_PASS: typeof env.DB_PASS === 'string' ? env.DB_PASS : '',
    DB_NAME: readString(env, 'DB_NAME', 'astroimg'),
    DB_LOGGING: readBoolean(env, 'DB_LOGGING', false),
    DB_SYNC: readBoolean(env, 'DB_SYNC', false),
    DB_RUN_MIGRATIONS: readBoolean(env, 'DB_RUN_MIGRATIONS', false),
    REDIS_HOST: readString(env, 'REDIS_HOST', '127.0.0.1'),
    REDIS_PORT: readNumber(env, 'REDIS_PORT', 6379, { min: 1, max: 65535 }),
    REDIS_PASS: typeof env.REDIS_PASS === 'string' ? env.REDIS_PASS : '',
    REDIS_DB: readNumber(env, 'REDIS_DB', 0, { min: 0 }),
    JWT_SECRET: readString(env, 'JWT_SECRET'),
    JWT_EXPIRES_IN: readString(env, 'JWT_EXPIRES_IN', '7d'),
    MINIO_ENDPOINT: readString(env, 'MINIO_ENDPOINT', '127.0.0.1'),
    MINIO_PORT: readNumber(env, 'MINIO_PORT', 9000, { min: 1, max: 65535 }),
    MINIO_ACCESS_KEY: readString(env, 'MINIO_ACCESS_KEY', 'minioadmin'),
    MINIO_SECRET_KEY: readString(env, 'MINIO_SECRET_KEY', 'minioadmin'),
    MINIO_BUCKET: readString(env, 'MINIO_BUCKET', 'astroimg'),
    MINIO_USE_SSL: readBoolean(env, 'MINIO_USE_SSL', false),
    MINIO_PUBLIC_URL: readString(env, 'MINIO_PUBLIC_URL', 'http://127.0.0.1:9000'),
    AI_PROVIDER: readString(env, 'AI_PROVIDER', 'openrouter').toLowerCase(),
    OPENAI_API_KEY: typeof env.OPENAI_API_KEY === 'string' ? env.OPENAI_API_KEY.trim() : '',
    OPENAI_BASE_URL: readString(env, 'OPENAI_BASE_URL', 'https://api.openai.com/v1'),
    OPENAI_MODEL: readString(env, 'OPENAI_MODEL', 'gpt-5.2'),
    OPENROUTER_API_KEY:
      typeof env.OPENROUTER_API_KEY === 'string' ? env.OPENROUTER_API_KEY.trim() : '',
    OPENROUTER_BASE_URL: readString(env, 'OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1'),
    OPENROUTER_MODEL: readString(env, 'OPENROUTER_MODEL', 'openai/gpt-oss-20b:free'),
  };

  if (!['openai', 'openrouter'].includes(validated.AI_PROVIDER)) {
    throw new Error('AI_PROVIDER must be either openai or openrouter');
  }

  if (!['development', 'test', 'production'].includes(validated.NODE_ENV)) {
    throw new Error('NODE_ENV must be one of development, test, production');
  }

  if (!['lax', 'strict', 'none'].includes(validated.COOKIE_SAME_SITE)) {
    throw new Error('COOKIE_SAME_SITE must be one of lax, strict, none');
  }

  if (
    validated.NODE_ENV === 'production' &&
    validated.CORS_ALLOWED_ORIGINS.trim().length === 0
  ) {
    throw new Error('CORS_ALLOWED_ORIGINS is required in production');
  }

  if (
    validated.NODE_ENV === 'production' &&
    validated.JWT_SECRET === 'change-me-in-prod'
  ) {
    throw new Error('JWT_SECRET must be changed in production');
  }

  return {
    ...env,
    ...validated,
  };
}
