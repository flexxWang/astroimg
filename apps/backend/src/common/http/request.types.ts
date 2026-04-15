import type { Request, Response } from 'express';

export type AuthenticatedUser = {
  id: string;
  username?: string;
  email?: string;
};

export type RequestWithContext = Request & {
  cookies?: {
    access_token?: string;
  };
  requestId?: string;
  traceId?: string;
  user?: AuthenticatedUser;
};

export type ResponseBodyShape = {
  message?: string | string[];
  errorCode?: string;
  details?: unknown;
};

export type ResponseWithBody = Response;
