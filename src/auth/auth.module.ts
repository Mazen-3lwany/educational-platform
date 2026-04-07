import { Module } from "@nestjs/common";
import { Authcontroller } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { PrismaService } from "../prisma.service.js";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MailModule } from "../mail/mail.module.js";
import { UserModule } from "../users/user.module.js";
import { FileUploadService } from "../uploads/upload.service.js";
import { GoogleStrategy } from "./strategies/google.strategy.js";



@Module({
    imports: [
        UserModule,
        MailModule,
        JwtModule.registerAsync({
            global: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '1h' }
            }),
        })
    ],
    controllers: [Authcontroller],
    providers: [AuthService, PrismaService, FileUploadService, GoogleStrategy]
})
export class AuthModule { }