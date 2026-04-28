export type AllowedOrigin = string | RegExp;

export function isOriginAllowed(
  origin: string,
  allowedOrigins: AllowedOrigin[],
) {
  return allowedOrigins.some((item) =>
    item instanceof RegExp ? item.test(origin) : item === origin,
  );
}

export function buildCorsOriginValidator(allowedOrigins: AllowedOrigin[]) {
  return (
    origin: string | undefined,
    callback: (error: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin || allowedOrigins.length === 0) {
      callback(null, true);
      return;
    }

    if (isOriginAllowed(origin, allowedOrigins)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin not allowed by CORS'));
  };
}
