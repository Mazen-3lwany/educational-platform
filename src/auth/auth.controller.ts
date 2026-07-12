import { BadRequestException, Body, Controller, Get, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { registerDto } from "./dtos/register.dto.js";
import { AuthService } from "./auth.service.js";
import { loginDto } from "./dtos/login.dto.js";
import { AuthGuard } from "./guards/auth.guard.js";
import { CurrentOauthUser, CurrentUser } from "./decorators/currentUser.decorator.js";
import { type UserType, type PayloadType } from "../utils/types.js";
import { changePasswordType } from "./dtos/changePassword.dto.js";
import { emailDto } from "./dtos/resendVerification.dto.js";
import { Throttle } from "@nestjs/throttler";

import { FileInterceptor } from "@nestjs/platform-express";
import { GoogleAuthGuard } from "./guards/google-auth.guard.js";
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from "@nestjs/swagger";

@ApiTags("Auth")
@Controller("api/users/auth")
export class Authcontroller {
    constructor(
        private readonly authService: AuthService,
    ) { }
    @Post("/register")
    @ApiOperation({ summary: "Register a new user" })
    @ApiConsumes("multipart/form-data")
    @ApiBody({ type: registerDto })
    @ApiResponse({ status: 201, description: "User registered successfully" })
    @ApiResponse({ status: 400, description: "Invalid input or file type" })
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
    @ApiOperation({ summary: "Login with email and password" })
    @ApiResponse({ status: 200, description: "Login successful, returns tokens" })
    @ApiResponse({ status: 401, description: "Invalid credentials" })
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    public async login(@Body() loginData: loginDto) {
        return await this.authService.login(loginData)
    }

    @Get("/verify-email/:userId/:verificationToken")
    @ApiOperation({ summary: "Verify user email via token" })
    @ApiResponse({ status: 200, description: "Email verified successfully" })
    @Throttle({ default: { limit: 20, ttl: 60000 } })
    public async verifiyToken(
        @Param("userId") userId: string,
        @Param("verificationToken") verificationToken: string
    ) {
        return await this.authService.verifiyMail(userId, verificationToken)
    }



    @Post('/refresh')
    @ApiOperation({ summary: "Refresh access token" })
    @ApiBody({ schema: { properties: { refreshToken: { type: "string" } } } })
    @ApiResponse({ status: 200, description: "Returns new access and refresh tokens" })
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
    @ApiOperation({ summary: "Logout and invalidate refresh token" })
    @ApiBody({ schema: { properties: { refreshToken: { type: "string" } } } })
    logout(@Body("refreshToken") refreshToken: string) {
        return this.authService.logout(refreshToken)
    }

    @Post("/forgot-password")
    @ApiOperation({ summary: "Request a password reset email" })
    @ApiBody({ schema: { properties: { email: { type: "string" } } } })
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    async forgotPassword(@Body("email") email: string) {
        return await this.authService.forgotPassword(email)
    }

    @Post("/reset-password/:resetToken")
    @ApiOperation({ summary: "Reset password using reset token" })
    @ApiBody({ schema: { properties: { newPassword: { type: "string" } } } })
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    public async resetPassword(
        @Param('resetToken') resetToken: string,
        @Body("newPassword") newPassword: string
    ) {
        return await this.authService.resetPassword(resetToken, newPassword)
    }

    @Patch("/change-password")
    @ApiBearerAuth()
    @ApiOperation({ summary: "Change password (requires authentication)" })
    @ApiBody({ type: changePasswordType })
    @ApiResponse({ status: 200, description: "Password changed successfully" })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    @UseGuards(AuthGuard)
    public async changePassword(
        @CurrentUser() payload: PayloadType,
        @Body('passwords') passwords: changePasswordType
    ) {
        return await this.authService.changePassword(payload, passwords)
    }
    @Patch("/resend-verifiy-email")
    @ApiOperation({ summary: "Resend email verification link" })
    @ApiBody({ type: emailDto })
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    public async resendVerifiyEmail(
        @Body('email') email: emailDto
    ) {
        return this.authService.resendVerificationEmail(email)
    }

    // sign in with Oauth (google)
    @Get('google')
    @ApiOperation({ summary: "Redirect to Google OAuth" })
    @UseGuards(GoogleAuthGuard)
    public googleAuth() {
        // turn user to google
    }
    @Get('/google/callback')
    @ApiOperation({ summary: "Redirect to Google OAuth" })
    @UseGuards(GoogleAuthGuard)
    async googleAuthRedirect(@CurrentOauthUser() user: UserType) {
        return this.authService.loginWithOauth(user)
    }
}