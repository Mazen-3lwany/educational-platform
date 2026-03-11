import { BadRequestException, Body, Controller, Get, Param, Post } from "@nestjs/common";
import { registerDto } from "./dtos/register.dto.js";
import { AuthService } from "./auth.service.js";
import { loginDto } from "./dtos/login.dto.js";

@Controller("api/users/auth")
export class Authcontroller {
    constructor(private readonly authService: AuthService) { }
    @Post("/register")
    public async register(@Body() userData: registerDto) {
        return await this.authService.register(userData)
    }
    @Post("/login")
    public async login(@Body() loginData: loginDto) {
        return await this.authService.login(loginData)
    }

    @Get("/verify-email/:userId/:verificationToken")
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
}