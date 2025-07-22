// src/auth/auth.module.ts
import { Module, forwardRef } from '@nestjs/common';
// ... (el resto de las importaciones)

@Module({
  imports: [
    forwardRef(() => AdminUserModule),
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '8h' }, // Token expires in 8 hours
    }),
    RoleModule,
    TypeOrmModule.forFeature([Studio]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
