import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RequestContextService } from '@/common/context/request-context.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly requestContext: RequestContextService) {
    super();
  }

  handleRequest<TUser extends { id?: string }>(
    err: unknown,
    user: TUser | false,
    info: unknown,
    context: ExecutionContext,
  ): TUser {
    void context;

    if (err instanceof Error) {
      throw err;
    }

    if (!user) {
      throw new UnauthorizedException(info);
    }

    if (typeof user.id === 'string' && user.id.length > 0) {
      this.requestContext.setUserId(user.id);
    }

    return user;
  }
}
