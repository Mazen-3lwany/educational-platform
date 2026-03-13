import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './users/user.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';


@Module({
  imports: [ConfigModule.forRoot(), UserModule, AuthModule,
  ThrottlerModule.forRoot({
    throttlers: [
      {
        ttl: 60000,
        limit: 100
      }
    ]
  })

  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ],
})
export class AppModule { }
