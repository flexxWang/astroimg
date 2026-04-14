import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestWithContext } from '@/common/http/request.types';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithContext>();
    return request.user as AuthUser | undefined;
  },
);
