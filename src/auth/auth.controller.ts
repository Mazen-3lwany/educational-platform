import { BadRequestException, Body, Controller, Get, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { registerDto } from "./dtos/register.dto.js";
import { AuthService } from "./auth.service.js";
import { loginDto } from "./dtos/login.dto.js";
import { AuthGuard } from "./guards/auth.guard.js";
import { CurrentUser } from "./decorators/currentUser.decorator.js";
import { type PayloadType } from "../utils/types.js";
import { changePasswordType } from "./dtos/changePassword.dto.js";
import { emailDto } from "./dtos/resendVerification.dto.js";
import { Throttle } from "@nestjs/throttler";

import { FileInterceptor } from "@nestjs/platform-express";


@Controller("api/users/auth")
export class Authcontroller {
    constructor(
        private readonly authService: AuthService,
    ) { }
    @Post("/register")
    @UseInterceptors(FileInterceptor('profileImage',
        {
            limits: {
                fileSize: 2 * 1024 * 1024, // 2MB
            },
            fileFilter: (req, file, cb) => {
                if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
                    return cb(new BadRequestException('Only image files are allowed!'), false);
                }
                cb(null, true);
            },
        }
    ))
    @Throttle({ default: { limit: 20, ttl: 60000 } })

    public async register(
        @Body() userData: registerDto,
        @UploadedFile() file?: Express.Multer.File
    ) {

        return await this.authService.register(userData, file)
    }
    @Post("/login")
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    public async login(@Body() loginData: loginDto) {
        return await this.authService.login(loginData)
    }

    @Get("/verify-email/:userId/:verificationToken")
    @Throttle({ default: { limit: 20, ttl: 60000 } })
    public async verifiyToken(
        @Param("userId") userId: string,
        @Param("verificationToken") verificationToken: string
    ) {
        return await this.authService.verifiyMail(userId, verificationToken)
    }



    @Post('/refresh')
    async refresh(@Body('refreshToken') refreshToken: string) {
        if (!refreshToken) {
            throw new BadRequestException('Refresh token is required');
        }

        // call service method
        const newTokens = await this.authService.refresh(refreshToken);

        return {
            accessToken: newTokens.access_token,
            refreshToken: newTokens.refresh_Token,
        };
    }

    @Post("logout")
    logout(@Body("refreshToken") refreshToken: string) {
        return this.authService.logout(refreshToken)
    }

    @Post("/forgot-password")
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    async forgotPassword(@Body("email") email: string) {
        return await this.authService.forgotPassword(email)
    }

    @Post("/reset-password/:resetToken")
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    public async resetPassword(
        @Param('resetToken') resetToken: string,
        @Body("newPassword") newPassword: string
    ) {
        return await this.authService.resetPassword(resetToken, newPassword)
    }

    @Patch("/change-password")
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    @UseGuards(AuthGuard)
    public async changePassword(
        @CurrentUser() payload: PayloadType,
        @Body('passwords') passwords: changePasswordType
    ) {
        return await this.authService.changePassword(payload, passwords)
    }
    @Patch("/resend-verifiy-email")
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    public async resendVerifiyEmail(
        @Body('email') email: emailDto
    ) {
        return this.authService.resendVerificationEmail(email)
    }
}