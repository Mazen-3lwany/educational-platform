import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './users/user.module.js';
import { AuthModule } from './auth/auth.module.js';


@Module({
  imports: [ConfigModule.forRoot(),UserModule,AuthModule],
  providers: [],
})
export class AppModule {}
