import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { UserService } from "./user.service.js";
import { AuthGuard } from "../auth/guards/auth.guard.js";
import { CurrentUser } from "../auth/decorators/currentUser.decorator.js";
import { type PayloadType } from "../utils/types.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { userRoles } from "../auth/decorators/roles.decorator.js";

import { updateUserDto } from "./dtos/update.dto.js";
import { Roles } from "../../generated/prisma/enums.js"; 

@Controller("api/users")
export class UserController {
    constructor(private readonly userService:UserService){}

    @Get("/")
    @UseGuards(AuthGuard)
    public async getAllUsers(){
        return await this.userService.getAllUsers()
    }
    @Get("/me")
    @UseGuards(AuthGuard)
    public async getMyProfile(@CurrentUser() payload:PayloadType){
        return this.userService.getCurrentUser(payload.id)
    }

    @Put("/update")
    @UseGuards(AuthGuard,RolesGuard)
    @userRoles(Roles.ADMIN,Roles.INSTRUCTOR)
    public async updateUser(@CurrentUser() payload:PayloadType,@Body() updateData:updateUserDto){
        return await this.userService.updateUser(payload.id,updateData)
    }
}