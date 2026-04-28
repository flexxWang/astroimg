import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { RequestWithContext } from '@/common/http/request.types';
import { AuthService } from './auth.service';

type JwtPayload = {
  sub: string;
  username: string;
  email: string;
  jti?: string;
  type?: 'access' | 'refresh';
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req?: RequestWithContext): string | null =>
          req?.cookies?.access_token ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload) {
    if (
      payload.type === 'refresh' ||
      !payload.jti ||
      (await this.authService.isTokenRevoked(payload.jti))
    ) {
      throw new UnauthorizedException();
    }

    return {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
    };
  }
}
