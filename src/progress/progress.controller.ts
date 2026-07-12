import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/guards/auth.guard.js";
import { CurrentUser } from "../auth/decorators/currentUser.decorator.js";
import { type PayloadType } from "../utils/types.js";
import { ProgressService } from "./progress.service.js";
import { UpdateWatchTimeDto } from "./Dto/updateWatchTime.dto.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { userRoles } from "../auth/decorators/roles.decorator.js";
import { Roles } from "../../generated/prisma/enums.js"
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from "@nestjs/swagger";

@ApiTags("Progress")
@ApiBearerAuth()
@Controller('api/progress')
export class ProgressController {
    constructor(private readonly progressService: ProgressService) { }

    @Post('lessons/:lessonId/start')
    @ApiOperation({ summary: "Mark a lesson as started for the current user" })
    @ApiParam({ name: "lessonId", description: "Lesson ID" })
    @ApiResponse({ status: 201, description: "Lesson marked as started" })
    @UseGuards(AuthGuard)
    public async startLesson(
        @Param('lessonId') lessonId: string,
        @CurrentUser() user: PayloadType
    ) {
        return this.progressService.startLesson(lessonId, user.id);
    }

    @Post('lessons/:lessonId/complete')
    @ApiOperation({ summary: "Mark a lesson as completed for the current user" })
    @ApiParam({ name: "lessonId", description: "Lesson ID" })
    @ApiResponse({ status: 201, description: "Lesson marked as completed" })
    @UseGuards(AuthGuard)
    public async completeLesson(
        @Param('lessonId') lessonId: string,
        @CurrentUser() user: PayloadType
    ) {
        return this.progressService.completeLesson(lessonId, user.id);
    }

    @Patch('lessons/:lessonId/watch-time')
    @ApiOperation({ summary: "Update watch time for a lesson" })
    @ApiParam({ name: "lessonId", description: "Lesson ID" })
    @ApiBody({ type: UpdateWatchTimeDto })
    @ApiResponse({ status: 200, description: "Watch time updated successfully" })
    @UseGuards(AuthGuard)
    public async updateWatchTime(
        @Param('lessonId') lessonId: string,
        @CurrentUser() user: PayloadType,
        @Body() dto: UpdateWatchTimeDto
    ) {
        return this.progressService.updateWatchTime(lessonId, user.id, dto.watchTime);
    }

    @Get('lessons/:lessonId')
    @ApiOperation({ summary: "Get the current user's progress for a lesson" })
    @ApiParam({ name: "lessonId", description: "Lesson ID" })
    @ApiResponse({ status: 200, description: "Returns the lesson progress" })
    @UseGuards(AuthGuard)
    public async getLessonProgress(
        @Param('lessonId') lessonId: string,
        @CurrentUser() user: PayloadType
    ) {
        return this.progressService.getLessonProgress(lessonId, user.id);
    }

    @Get('students/me')
    @ApiOperation({ summary: "Get all progress records for the current student" })
    @ApiResponse({ status: 200, description: "Returns all progress for the student" })
    @UseGuards(AuthGuard)
    public async getAllProgressForStudent(
        @CurrentUser() user: PayloadType
    ) {
        return this.progressService.getAllProgressForStudent(user.id);
    }

    @Get('students/:studentId/courses/:courseId')
    @ApiOperation({ summary: "Get a specific student's progress in a course (Admin/Instructor only)" })
    @ApiParam({ name: "studentId", description: "Student ID" })
    @ApiParam({ name: "courseId", description: "Course ID" })
    @ApiResponse({ status: 200, description: "Returns the student's progress in the course" })
    @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN or INSTRUCTOR role" })
    @UseGuards(AuthGuard, RolesGuard)
    @userRoles(Roles.ADMIN, Roles.INSTRUCTOR)
    public async getProgressForStudentInCourse(
        @Param('studentId') studentId: string,
        @Param('courseId') courseId: string
    ) {
        return this.progressService.getProgressForStudentInCourse(studentId, courseId);
    }
}