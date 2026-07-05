import { Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { EnrollService } from "./enroll.service.js";
import { AuthGuard } from "../auth/guards/auth.guard.js";
import { CurrentUser } from "../auth/decorators/currentUser.decorator.js";
import { type PayloadType } from "../utils/types.js";
import { PaginationDto } from "../courses/dtos/pagination.dto.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { userRoles } from "../auth/decorators/roles.decorator.js";
import { Roles } from "../../generated/prisma/enums.js";

@Controller('api/enrollments')
export class EnrollController {
    constructor(private readonly enrollService: EnrollService) { }
    @Post('courses/:courseId')
    @UseGuards(AuthGuard)
    async enrollCourse(
        @Param('courseId') courseId: string,
        @CurrentUser() user: PayloadType
    ) {
        return await this.enrollService.enrollCourse(user.id, courseId)
    }

    @Get('courses')
    @UseGuards(AuthGuard)
    async getAllEnrollCoursesForStudent(
        @Query() paginationDto: PaginationDto,
        @CurrentUser() user: PayloadType
    ) {
        
        return await this.enrollService.findAllCoursesForStudent(user.id, paginationDto.page, paginationDto.limit)
    }
    @Get('courses/:courseId/students')
    @UseGuards(AuthGuard,RolesGuard)
    @userRoles(Roles.ADMIN,Roles.INSTRUCTOR)
    async getAllStudentsEnrolledInCourse(
        @Param('courseId') courseId: string,
        @Query() paginationDto: PaginationDto,
    ) {
        
        return await this.enrollService.findAllStudentsForCourse(courseId, paginationDto.page, paginationDto.limit)
    }
    @Delete('courses/:courseId')
    @UseGuards(AuthGuard)
    async unenrollCourse(
        @CurrentUser() user: PayloadType,
        @Param('courseId') courseId: string
    ) {
        return await this.enrollService.unenrollCourse(user.id, courseId)
    }
}