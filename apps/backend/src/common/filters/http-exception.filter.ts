import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
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
    default:
      return ErrorCode.INTERNAL_SERVER_ERROR;
  }
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
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

    response.status(status).json({
      code: status,
      data: null,
      msg: message,
      path: request.url,
      errorCode,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}
