import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/guards/auth.guard.js";
import { CurrentUser } from "../auth/decorators/currentUser.decorator.js";
import {type PayloadType } from "../utils/types.js";
import { ProgressService } from "./progress.service.js";
import { UpdateWatchTimeDto } from "./Dto/updateWatchTime.dto.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { userRoles } from "../auth/decorators/roles.decorator.js";
import { Roles } from "../../generated/prisma/enums.js"

@Controller('api/progress')
export class ProgressController{
    constructor(private readonly progressService:ProgressService){}
    @Post('lessons/:lessonId/start')
    @UseGuards(AuthGuard)
    public async startLesson(
        @Param('lessonId') lessonId:string,
        @CurrentUser() user:PayloadType
    ){
        return this.progressService.startLesson(lessonId, user.id);
    }
    @Post('lessons/:lessonId/complete')
    @UseGuards(AuthGuard)
    public async completeLesson(
        @Param('lessonId') lessonId:string,
        @CurrentUser() user:PayloadType
    ){
        return this.progressService.completeLesson(lessonId, user.id);
    }

    @Patch('lessons/:lessonId/watch-time')
    @UseGuards(AuthGuard)
    public async updateWatchTime(
        @Param('lessonId') lessonId:string,
        @CurrentUser() user:PayloadType,
        @Body() dto:UpdateWatchTimeDto
    ){
        return this.progressService.updateWatchTime(lessonId, user.id, dto.watchTime);
    }
    @Get('lessons/:lessonId')
    @UseGuards(AuthGuard)
    public async getLessonProgress(
        @Param('lessonId') lessonId:string,
        @CurrentUser() user:PayloadType
    ){
        return this.progressService.getLessonProgress(lessonId, user.id);
    }
    @Get('students/me')
    @UseGuards(AuthGuard)
    public async getAllProgressForStudent(
        @CurrentUser() user:PayloadType
    ){
        return this.progressService.getAllProgressForStudent(user.id);
    }
    @Get('students/:studentId/courses/:courseId')
    @UseGuards(AuthGuard,RolesGuard)
    @userRoles(Roles.ADMIN,Roles.INSTRUCTOR)
    public async getProgressForStudentInCourse(
        @Param('studentId') studentId:string,
        @Param('courseId') courseId:string
    ){
        return this.progressService.getProgressForStudentInCourse(studentId, courseId);
    }
}
