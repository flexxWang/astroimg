import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AppLogger } from '@/common/logging/app-logger.service';
import { Sentry, isBackendSentryEnabled } from '@/common/monitoring/sentry';
import { ErrorCode } from '../exceptions/error-codes';
import { getErrorMessageByCode } from '../exceptions/error-messages';

function defaultErrorCode(status: number) {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return ErrorCode.BAD_REQUEST;
    case HttpStatus.UNAUTHORIZED:
      return ErrorCode.UNAUTHORIZED;
    case HttpStatus.FORBIDDEN:
      return ErrorCode.FORBIDDEN;
    case HttpStatus.NOT_FOUND:
      return ErrorCode.NOT_FOUND;
    case HttpStatus.CONFLICT:
      return ErrorCode.CONFLICT;
    case HttpStatus.TOO_MANY_REQUESTS:
      return ErrorCode.TOO_MANY_REQUESTS;
    default:
      return ErrorCode.INTERNAL_SERVER_ERROR;
  }
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = isHttpException
      ? exception.getResponse()
      : { message: 'Internal server error' };

    const responseBody =
      typeof errorResponse === 'string'
        ? { message: errorResponse }
        : (errorResponse as Record<string, unknown>);

    const errorCode =
      typeof responseBody.errorCode === 'string'
        ? responseBody.errorCode
        : status === HttpStatus.BAD_REQUEST &&
            Array.isArray(responseBody.message)
          ? ErrorCode.VALIDATION_ERROR
          : defaultErrorCode(status);
    const message =
      responseBody.message && Array.isArray(responseBody.message)
        ? responseBody.message
        : typeof responseBody.message === 'string' &&
            responseBody.message.trim().length > 0
          ? responseBody.message
          : getErrorMessageByCode(errorCode as ErrorCode) ||
            '服务开小差了，请稍后再试';
    const details = responseBody.details;
    const requestId =
      typeof request.requestId === 'string' ? request.requestId : undefined;
    const traceId =
      typeof request.traceId === 'string' ? request.traceId : undefined;
    const userId =
      typeof request.user?.id === 'string' ? request.user.id : undefined;

    const meta = {
      method: request.method,
      path: request.url,
      requestId,
      traceId,
      userId,
      errorCode,
      status,
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      if (isBackendSentryEnabled()) {
        Sentry.withScope((scope) => {
          scope.setLevel('error');
          scope.setTag('error_code', String(errorCode));
          scope.setTag('request_id', requestId ?? 'unknown');
          scope.setTag('trace_id', traceId ?? requestId ?? 'unknown');
          scope.setContext('request', {
            method: request.method,
            path: request.url,
            requestId,
            traceId,
          });
          if (userId) {
            scope.setUser({ id: userId });
          }
          scope.setExtras(
            details && typeof details === 'object'
              ? { details: details as Record<string, unknown> }
              : {},
          );
          Sentry.captureException(
            exception instanceof Error
              ? exception
              : new Error(
                  typeof message === 'string'
                    ? message
                    : JSON.stringify(message),
                ),
          );
        });
      }

      this.logger.error(
        typeof message === 'string' ? message : JSON.stringify(message),
        exception,
        meta,
      );
    } else {
      this.logger.warn('http.request.failed', { ...meta, message });
    }

    response.status(status).json({
      code: status,
      data: null,
      msg: message,
      path: request.url,
      requestId,
      traceId,
      errorCode,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}
