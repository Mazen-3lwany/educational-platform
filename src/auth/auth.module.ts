import { Module } from "@nestjs/common";
import { Authcontroller } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { PrismaService } from "../prisma.service.js";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";



@Module({
    imports:[
        JwtModule.registerAsync({
        imports:[ConfigModule],
        inject:[ConfigService],
        useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
    }),
    })],
    controllers:[Authcontroller],
    providers:[AuthService,PrismaService]
})
export class AuthModule {}