import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-codes';
import { resolveErrorMessage } from './error-messages';

export class AppException extends HttpException {
  constructor(
    status: HttpStatus,
    errorCode: ErrorCode,
    message?: string | string[],
    details?: unknown,
  ) {
    super(
      {
        message: resolveErrorMessage(errorCode, message),
        errorCode,
        details,
      },
      status,
    );
  }

  static badRequest(
    errorCode: ErrorCode,
    message?: string | string[],
    details?: unknown,
  ) {
    return new AppException(
      HttpStatus.BAD_REQUEST,
      errorCode,
      message,
      details,
    );
  }

  static unauthorized(
    errorCode: ErrorCode,
    message?: string | string[],
    details?: unknown,
  ) {
    return new AppException(
      HttpStatus.UNAUTHORIZED,
      errorCode,
      message,
      details,
    );
  }

  static conflict(
    errorCode: ErrorCode,
    message?: string | string[],
    details?: unknown,
  ) {
    return new AppException(HttpStatus.CONFLICT, errorCode, message, details);
  }

  static notFound(
    errorCode: ErrorCode,
    message?: string | string[],
    details?: unknown,
  ) {
    return new AppException(HttpStatus.NOT_FOUND, errorCode, message, details);
  }

  static internal(
    errorCode: ErrorCode,
    message?: string | string[],
    details?: unknown,
  ) {
    return new AppException(
      HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode,
      message,
      details,
    );
  }

  static tooManyRequests(
    errorCode: ErrorCode,
    message?: string | string[],
    details?: unknown,
  ) {
    return new AppException(
      HttpStatus.TOO_MANY_REQUESTS,
      errorCode,
      message,
      details,
    );
  }
}
