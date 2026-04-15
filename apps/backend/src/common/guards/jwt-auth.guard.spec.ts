import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RequestContextService } from '@/common/context/request-context.service';

describe('JwtAuthGuard', () => {
  it('writes authenticated user id into request context', () => {
    const setUserId = jest.fn();
    const requestContext = {
      setUserId,
    } as unknown as RequestContextService;
    const guard = new JwtAuthGuard(requestContext);

    const user = guard.handleRequest(
      null,
      { id: 'user-123', username: 'demo' },
      null,
      {} as ExecutionContext,
    );

    expect(user).toEqual({ id: 'user-123', username: 'demo' });
    expect(setUserId).toHaveBeenCalledWith('user-123');
  });

  it('throws unauthorized when user is missing', () => {
    const requestContext = {
      setUserId: jest.fn(),
    } as unknown as RequestContextService;
    const guard = new JwtAuthGuard(requestContext);

    expect(() =>
      guard.handleRequest(null, false, 'missing', {} as ExecutionContext),
    ).toThrow(UnauthorizedException);
  });
});
