import { Injectable, NestMiddleware } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import type { NextFunction, Response } from 'express';
import { AppException, ErrorCode } from '@/common/exceptions';
import type { RequestWithContext } from '@/common/http/request.types';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAMES = ['x-csrf-token', 'csrf-token'];

function hasAuthCookie(req: RequestWithContext) {
  return Boolean(req.cookies?.access_token || req.cookies?.refresh_token);
}

function extractHeaderToken(req: RequestWithContext) {
  for (const name of CSRF_HEADER_NAMES) {
    const value = req.get(name);
    if (value) {
      return value;
    }
  }

  return undefined;
}

function safeEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: RequestWithContext, _res: Response, next: NextFunction) {
    if (SAFE_METHODS.has(req.method) || !hasAuthCookie(req)) {
      next();
      return;
    }

    const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
    const headerToken = extractHeaderToken(req);

    if (!cookieToken || !headerToken || !safeEquals(cookieToken, headerToken)) {
      throw AppException.forbidden(
        ErrorCode.FORBIDDEN,
        'CSRF token is missing or invalid',
      );
    }

    next();
  }
}

export { CSRF_COOKIE_NAME };
