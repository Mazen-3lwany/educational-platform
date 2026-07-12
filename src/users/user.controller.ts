import { Body, Controller, Delete, Get, Param, Patch, Query, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
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
import { FileInterceptor } from "@nestjs/platform-express";
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from "@nestjs/swagger";

@ApiTags("Users")
@ApiBearerAuth()
@Controller("api/users")
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get("/")
    @ApiOperation({ summary: "Get all users (Admin/Instructor only)" })
    @ApiResponse({ status: 200, description: "Returns a paginated list of users" })
    @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN or INSTRUCTOR role" })
    @userRoles(Roles.ADMIN, Roles.INSTRUCTOR)
    @UseGuards(AuthGuard, RolesGuard)
    public async getAllUsers(
        @Query() userQuery: GetUsersQueryDto
    ) {
        return await this.userService.getAllUsers(userQuery.page, userQuery.limit)
    }

    @Get("/me")
    @ApiOperation({ summary: "Get the current user's profile" })
    @ApiResponse({ status: 200, description: "Returns the current user's profile" })
    @UseGuards(AuthGuard)
    public async getMyProfile(@CurrentUser() payload: PayloadType) {
        return this.userService.getCurrentUserProfile(payload.id)
    }

    @Get('/:id')
    @ApiOperation({ summary: "Get a specific user by ID (Admin only)" })
    @ApiParam({ name: "id", description: "User ID" })
    @ApiResponse({ status: 200, description: "Returns the user" })
    @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
    @userRoles(Roles.ADMIN)
    @UseGuards(AuthGuard, RolesGuard)
    public async getSpecificUser(
        @Param("id") userId: string
    ) {
        return this.userService.findUserById(userId)
    }

    @Patch("/me")
    @ApiOperation({ summary: "Update the current user's profile" })
    @ApiBody({ type: updateMeDto })
    @ApiResponse({ status: 200, description: "Profile updated successfully" })
    @UseGuards(AuthGuard)
    public async updateMe(@CurrentUser() payload: PayloadType, @Body() updateData: updateMeDto) {
        return this.userService.updateUser(payload.id, updateData)
    }

    @Patch("/profile-image")
    @ApiOperation({ summary: "Update the current user's profile image" })
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                profileImage: { type: "string", format: "binary" },
            },
        },
    })
    @ApiResponse({ status: 200, description: "Profile image updated successfully" })
    @UseGuards(AuthGuard)
    @UseInterceptors(FileInterceptor('profileImage', {
        limits: {
            fileSize: 2 * 1024 * 1024, // 2MB
        },
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
                return cb(new Error('Only image files are allowed!'), false);
            }
            cb(null, true);
        },
    }))
    public updateProfileImage(
        @CurrentUser() payload: PayloadType,
        @UploadedFile() file?: Express.Multer.File
    ) {
        console.log(payload);
        return this.userService.updateProfileImage(payload.id, file)
    }

    @Patch("/:id")
    @ApiOperation({ summary: "Update a specific user's role/status (Admin only)" })
    @ApiParam({ name: "id", description: "User ID" })
    @ApiBody({ type: updateForAdminDto })
    @ApiResponse({ status: 200, description: "User updated successfully" })
    @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
    @UseGuards(AuthGuard, RolesGuard)
    @userRoles(Roles.ADMIN)
    public async updateSpecificUser(
        @Param("id") id: string,
        @Body() updateData: updateForAdminDto
    ) {
        return this.userService.updateUser(id, updateData)
    }

    @Delete("/me")
    @ApiOperation({ summary: "Delete the current user's own account" })
    @ApiResponse({ status: 200, description: "Account deleted successfully" })
    @UseGuards(AuthGuard)
    public async deleteAccount(
        @CurrentUser() payload: PayloadType
    ) {
        return this.userService.deleteUser(payload.id)
    }

    @Delete("/:id")
    @ApiOperation({ summary: "Permanently delete a specific user (Admin only)" })
    @ApiParam({ name: "id", description: "User ID" })
    @ApiResponse({ status: 200, description: "User deleted successfully" })
    @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
    @UseGuards(AuthGuard, RolesGuard)
    @userRoles(Roles.ADMIN)
    public async deleteSpecificUser(
        @Param('id') id: string
    ) {
        return this.userService.deleteUser(id)
    }

    @Delete("/:id/soft")
    @ApiOperation({ summary: "Soft delete a specific user (Admin only)" })
    @ApiParam({ name: "id", description: "User ID" })
    @ApiResponse({ status: 200, description: "User soft-deleted successfully" })
    @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
    @UseGuards(AuthGuard, RolesGuard)
    @userRoles(Roles.ADMIN)
    public async softDeleteSpecificUser(
        @Param('id') id: string
    ) {
        return this.userService.softDeleteUser(id)
    }
}