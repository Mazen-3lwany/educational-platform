import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { CourseService } from "./course.service.js";
import { CurrentUser } from "../auth/decorators/currentUser.decorator.js";
import { type PayloadType } from "../utils/types.js";
import { AuthGuard } from "../auth/guards/auth.guard.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { userRoles } from "../auth/decorators/roles.decorator.js";
import { Roles } from "../../generated/prisma/enums.js";
import { FileInterceptor } from "@nestjs/platform-express";
import { createCourseDTO } from "./dtos/createCourse.dto.js";
import { updateCourse } from "./dtos/updateCourse.dto.js";
import { UpdateCourseStatusDto } from "./dtos/updateCourseStatus.dto.js";
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from "@nestjs/swagger";

@ApiTags("Courses")
@Controller("api/course")
export class CourseController {
    constructor(private readonly courseService: CourseService) { }

    @Post("")
    @ApiOperation({ summary: "Create a new course (Instructor only)" })
    @ApiBearerAuth()
    @ApiConsumes("multipart/form-data")
    @ApiBody({ type: createCourseDTO })
    @ApiResponse({ status: 201, description: "Course created successfully" })
    @ApiResponse({ status: 403, description: "Forbidden - requires INSTRUCTOR role" })
    @UseInterceptors(FileInterceptor('banner', {
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB
        },
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
                return cb(new BadRequestException('Only image files are allowed!'), false);
            }
            cb(null, true);
        },
    }))
    @UseGuards(AuthGuard, RolesGuard)
    @userRoles(Roles.INSTRUCTOR)
    public async createCourse(
        @CurrentUser() payload: PayloadType,
        @Body() courseData: createCourseDTO,
        @UploadedFile() file?: Express.Multer.File
    ) {
        return await this.courseService.createCourse(payload, courseData, file)
    }

    @Get("/specific/:courseId")
    @ApiOperation({ summary: "Get a single course by ID" })
    @ApiParam({ name: "courseId", description: "Course ID" })
    @ApiResponse({ status: 200, description: "Returns the course" })
    @ApiResponse({ status: 404, description: "Course not found" })
    public async getSpecificCourse(@Param('courseId') courseId: string) {
        return this.courseService.getCourseById(courseId)
    }

    @Get("/")
    @ApiOperation({ summary: "Get all courses (paginated)" })
    @ApiQuery({ name: "page", required: false, example: 1 })
    @ApiQuery({ name: "limit", required: false, example: 10 })
    @ApiResponse({ status: 200, description: "Returns a paginated list of courses" })
    public async getAllCourses(
        @Query('page') Page: string,
        @Query('limit') Limit: string
    ) {
        const page = Number(Page) || 1
        const limit = Number(Limit) || 10
        return this.courseService.getAllCourses(page, limit)
    }

    @Get('/instructor-courses/:instructorId')
    @ApiOperation({ summary: "Get all courses by a specific instructor" })
    @ApiParam({ name: "instructorId", description: "Instructor ID" })
    @ApiResponse({ status: 200, description: "Returns the instructor's courses" })
    public async getCoursesByInstructor(
        @Param('instructorId') instructorId: string
    ) {
        return this.courseService.getCoursesByInstructor(instructorId)
    }

    @Get("/mycourses")
    @ApiOperation({ summary: "Get the logged-in instructor's own courses" })
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: "Returns the current instructor's courses" })
    @UseGuards(AuthGuard, RolesGuard)
    @userRoles('INSTRUCTOR')
    public async getInstructorCourses(
        @CurrentUser() payload: PayloadType
    ) {
        return this.courseService.getMyCourses(payload)
    }

    @Patch(':updateCourseId')
    @ApiOperation({ summary: "Update a course (Instructor only)" })
    @ApiBearerAuth()
    @ApiParam({ name: "updateCourseId", description: "Course ID to update" })
    @ApiConsumes("multipart/form-data")
    @ApiBody({ type: updateCourse })
    @ApiResponse({ status: 200, description: "Course updated successfully" })
    @ApiResponse({ status: 403, description: "Forbidden - requires INSTRUCTOR role" })
    @UseInterceptors(FileInterceptor('banner', {
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB
        },
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
                return cb(new BadRequestException('Only image files are allowed!'), false);
            }
            cb(null, true);
        },
    }))
    @UseGuards(AuthGuard, RolesGuard)
    @userRoles('INSTRUCTOR')
    public async updateCourse(
        @Param('updateCourseId') courseId: string,
        @CurrentUser() payload: PayloadType,
        @Body() courseData?: updateCourse,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        return this.courseService.updateCourse(courseId, payload, courseData, file)
    }

    @Patch('/update-status/:courseId')
    @ApiOperation({ summary: "Update a course's status (Instructor only)" })
    @ApiBearerAuth()
    @ApiParam({ name: "courseId", description: "Course ID" })
    @ApiBody({ type: UpdateCourseStatusDto })
    @ApiResponse({ status: 200, description: "Course status updated successfully" })
    @ApiResponse({ status: 403, description: "Forbidden - requires INSTRUCTOR role" })
    @UseGuards(AuthGuard, RolesGuard)
    @userRoles('INSTRUCTOR')
    public async updateCourseStatus(
        @Param('courseId') courseId: string,
        @CurrentUser() payload: PayloadType,
        @Body() courseStatus: UpdateCourseStatusDto
    ) {
        return this.courseService.updateCourseStatus(courseId, payload, courseStatus)
    }

    // Add lesson 
    // Add quiz 

    //delete course (soft delete)
    @Delete('/delete/:courseId')
    @ApiOperation({ summary: "Soft delete a course (Instructor only)" })
    @ApiBearerAuth()
    @ApiParam({ name: "courseId", description: "Course ID to delete" })
    @ApiResponse({ status: 200, description: "Course deleted successfully" })
    @ApiResponse({ status: 403, description: "Forbidden - requires INSTRUCTOR role" })
    @UseGuards(AuthGuard, RolesGuard)
    @userRoles('INSTRUCTOR')
    public async deleteCourse(
        @Param('courseId') courseId: string,
        @CurrentUser() payload: PayloadType
    ) {
        return this.courseService.deleteCourse(courseId, payload)
    }

    @Patch('restore/:courseId')
    @ApiOperation({ summary: "Restore a soft-deleted course (Instructor only)" })
    @ApiBearerAuth()
    @ApiParam({ name: "courseId", description: "Course ID to restore" })
    @ApiResponse({ status: 200, description: "Course restored successfully" })
    @ApiResponse({ status: 403, description: "Forbidden - requires INSTRUCTOR role" })
    @UseGuards(AuthGuard, RolesGuard)
    @userRoles('INSTRUCTOR')
    public async restoreCourse(
        @Param('courseId') courseId: string,
        @CurrentUser() payload: PayloadType
    ) {
        return this.courseService.restoreCourse(courseId, payload)
    }
}