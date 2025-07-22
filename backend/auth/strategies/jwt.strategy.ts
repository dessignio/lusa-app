/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from '../auth.module'; // Reuse the secret
import { AdminUserService } from 'src/admin-user/admin-user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly adminUserService: AdminUserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any) {
    console.log('[JwtStrategy] Validating payload:', payload);
    const user = await this.adminUserService.findOne(payload.sub, payload.studioId);
    if (!user) {
      console.log('[JwtStrategy] User not found for payload:', payload);
      throw new UnauthorizedException();
    }
    console.log('[JwtStrategy] User found:', user.id);
    return user;
  }
}
