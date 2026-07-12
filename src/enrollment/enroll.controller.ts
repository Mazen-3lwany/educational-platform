import { Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { EnrollService } from "./enroll.service.js";
import { AuthGuard } from "../auth/guards/auth.guard.js";
import { CurrentUser } from "../auth/decorators/currentUser.decorator.js";
import { type PayloadType } from "../utils/types.js";
import { PaginationDto } from "../courses/dtos/pagination.dto.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { userRoles } from "../auth/decorators/roles.decorator.js";
import { Roles } from "../../generated/prisma/enums.js";
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from "@nestjs/swagger";

@ApiTags("Enrollments")
@ApiBearerAuth()
@Controller('api/enrollments')
export class EnrollController {
    constructor(private readonly enrollService: EnrollService) { }

    @Post('courses/:courseId')
    @ApiOperation({ summary: "Enroll the current user in a course" })
    @ApiParam({ name: "courseId", description: "Course ID to enroll in" })
    @ApiResponse({ status: 201, description: "Enrolled successfully" })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @UseGuards(AuthGuard)
    async enrollCourse(
        @Param('courseId') courseId: string,
        @CurrentUser() user: PayloadType
    ) {
        return await this.enrollService.enrollCourse(user.id, courseId)
    }

    @Get('courses')
    @ApiOperation({ summary: "Get all courses the current student is enrolled in" })
    @ApiResponse({ status: 200, description: "Returns a paginated list of enrolled courses" })
    @UseGuards(AuthGuard)
    async getAllEnrollCoursesForStudent(
        @Query() paginationDto: PaginationDto,
        @CurrentUser() user: PayloadType
    ) {
        return await this.enrollService.findAllCoursesForStudent(user.id, paginationDto.page, paginationDto.limit)
    }

    @Get('courses/:courseId/students')
    @ApiOperation({ summary: "Get all students enrolled in a course (Admin/Instructor only)" })
    @ApiParam({ name: "courseId", description: "Course ID" })
    @ApiResponse({ status: 200, description: "Returns a paginated list of enrolled students" })
    @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN or INSTRUCTOR role" })
    @UseGuards(AuthGuard, RolesGuard)
    @userRoles(Roles.ADMIN, Roles.INSTRUCTOR)
    async getAllStudentsEnrolledInCourse(
        @Param('courseId') courseId: string,
        @Query() paginationDto: PaginationDto,
    ) {
        return await this.enrollService.findAllStudentsForCourse(courseId, paginationDto.page, paginationDto.limit)
    }

    @Delete('courses/:courseId')
    @ApiOperation({ summary: "Unenroll the current user from a course" })
    @ApiParam({ name: "courseId", description: "Course ID to unenroll from" })
    @ApiResponse({ status: 200, description: "Unenrolled successfully" })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @UseGuards(AuthGuard)
    async unenrollCourse(
        @CurrentUser() user: PayloadType,
        @Param('courseId') courseId: string
    ) {
        return await this.enrollService.unenrollCourse(user.id, courseId)
    }
}