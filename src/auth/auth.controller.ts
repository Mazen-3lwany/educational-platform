import { Body, Controller, Post } from "@nestjs/common";
import { registerDto } from "./dtos/register.dto.js";
import { AuthService } from "./auth.service.js";
import { loginDto } from "./dtos/login.dto.js";

@Controller("api/users/auth")
export class Authcontroller {
    constructor(private readonly authService:AuthService){}
    @Post("/register")
    public async register(@Body() userData:registerDto){    
        return await this.authService.register(userData)
    }
    @Post("/login")
    public async login(@Body() loginData:loginDto){
        return await this.authService.login(loginData)
    }
}