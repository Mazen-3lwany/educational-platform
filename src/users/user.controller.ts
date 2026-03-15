import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { UserService } from "./user.service.js";
import { AuthGuard } from "../auth/guards/auth.guard.js";
import { CurrentUser } from "../auth/decorators/currentUser.decorator.js";
import { type PayloadType } from "../utils/types.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { userRoles } from "../auth/decorators/roles.decorator.js";

import { updateMeDto } from "./dtos/update.dto.js";
import { Roles } from "../../generated/prisma/enums.js";
import { GetUsersQueryDto } from "./dtos/usersQuery.dto.js";
import { updateForAdminDto } from "./dtos/updateForAdmin.dto.js";


@Controller("api/users")
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get("/")
    @userRoles(Roles.ADMIN, Roles.INSTRUCTOR)
    @UseGuards(AuthGuard, RolesGuard)
    public async getAllUsers(
        @Query() userQuery: GetUsersQueryDto
    ) {
        return await this.userService.getAllUsers(userQuery.page, userQuery.limit)
    }
    @Get("/me")
    @UseGuards(AuthGuard)
    public async getMyProfile(@CurrentUser() payload: PayloadType) {
        return this.userService.getCurrentUserProfile(payload.id)
    }

    @Get('/:id')
    @userRoles(Roles.ADMIN)
    @UseGuards(AuthGuard, RolesGuard)
    public async getSpecificUser(
        @Param("id") userId: string
    ) {
        return this.userService.findUserById(userId)
    }

    @Patch("/me")
    @UseGuards(AuthGuard)
    public async updateMe(@CurrentUser() payload: PayloadType, @Body() updateData: updateMeDto) {
        return this.userService.updateUser(payload.id, updateData)
    }
    @Patch("/:id")

    @UseGuards(AuthGuard, RolesGuard)
    @userRoles(Roles.ADMIN)
    public async updateSpecificUser(
        @Param("id") id: string,
        @Body() updateData: updateForAdminDto
    ) {
        return this.userService.updateUser(id, updateData)
    }

    @Delete("/me")
    @UseGuards(AuthGuard)
    public async deleteAccount(
        @CurrentUser() payload: PayloadType
    ) {
        return this.userService.deleteUser(payload.id)
    }
    @Delete("/:id")
    @UseGuards(AuthGuard, RolesGuard)
    @userRoles(Roles.ADMIN)
    public async deleteSpecificUser(
        @Param('id') id: string
    ) {
        return this.userService.deleteUser(id)
    }
    @Delete("/:id/soft")
    @UseGuards(AuthGuard, RolesGuard)
    @userRoles(Roles.ADMIN)
    public async softDeleteSpecificUser(
        @Param('id') id: string
    ) {
        return this.userService.softDeleteUser(id)
    }
}