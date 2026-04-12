import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { CourseService } from "./course.service.js";
import { CurrentUser } from "../auth/decorators/currentUser.decorator.js";
import {type PayloadType } from "../utils/types.js";
import { AuthGuard } from "../auth/guards/auth.guard.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { userRoles } from "../auth/decorators/roles.decorator.js";
import {  Roles } from "../../generated/prisma/enums.js";
import { FileInterceptor } from "@nestjs/platform-express";
import { createCourseDTO } from "./dtos/createCourse.dto.js";
import { updateCourse } from "./dtos/updateCourse.dto.js";
import { UpdateCourseStatusDto } from "./dtos/updateCourseStatus.dto.js";

@Controller("api/course")
export class CourseController{
    constructor(private readonly courseService:CourseService){}
    @Post("")
    @UseInterceptors(FileInterceptor('banner',
            {
                limits: {
                    fileSize: 5 * 1024 * 1024, // 5MB
                },
                fileFilter: (req, file, cb) => {
                    if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
                        return cb(new BadRequestException('Only image files are allowed!'), false);
                    }
                    cb(null, true);
                },
            }
        ))
    @UseGuards(AuthGuard,RolesGuard)
    @userRoles(Roles.INSTRUCTOR)
    public async createCourse(
        @CurrentUser() payload:PayloadType,
        @Body() courseData:createCourseDTO,
        @UploadedFile() file?:Express.Multer.File
        
    ){
        return await this.courseService.createCourse(payload,courseData,file)
    }
    @Get("/specific/:courseId")
    public async getSpecificCourse(@Param('courseId') courseId:string){
        return this.courseService.getCourseById(courseId)
    }
    @Get("/")
    public async getAllCourses(
        @Query('page') Page:string,
        @Query('limit') Limit:string
    ){
        const page = Number(Page)||1
        const limit= Number(Limit)||10
        return this.courseService.getAllCourses(page,limit)
    }
    @Get('/instructor-courses/:instructorId')
    public async getCoursesByInstructor(
        @Param('instructorId') instructorId:string
    ){
        return this.courseService.getCoursesByInstructor(instructorId)
    }
    @Get("/mycourses")
    @UseGuards(AuthGuard,RolesGuard)
    @userRoles('INSTRUCTOR')
    public async getInstructorCourses(
        @CurrentUser() payload:PayloadType
    ){
        return this.courseService.getMyCourses(payload)
    }

    @Patch(':updateCourseId')
    @UseInterceptors(FileInterceptor('banner',
            {
                limits: {
                    fileSize: 5 * 1024 * 1024, // 5MB
                },
                fileFilter: (req, file, cb) => {
                    if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
                        return cb(new BadRequestException('Only image files are allowed!'), false);
                    }
                    cb(null, true);
                },
            }
        ))
    @UseGuards(AuthGuard,RolesGuard)
    @userRoles('INSTRUCTOR')
    public async updateCourse(
        @Param('updateCourseId') courseId:string,
        @CurrentUser() payload:PayloadType,
        @Body()courseData?:updateCourse,
        @UploadedFile() file?:Express.Multer.File,
    ){
        return this.courseService.updateCourse(courseId,payload,courseData,file)
    }

@Patch('/update-status/:courseId')
@UseGuards(AuthGuard,RolesGuard)
@userRoles('INSTRUCTOR')
public async updateCourseStatus(
    @Param('courseId') courseId:string,
    @CurrentUser() payload:PayloadType,
    @Body() courseStatus:UpdateCourseStatusDto
){
    return this.courseService.updateCourseStatus(courseId,payload,courseStatus)
}
// Add lesson 
// Add quiz 


//delete course (soft delete)
@Delete('/delete/:courseId')
@UseGuards(AuthGuard,RolesGuard)
@userRoles('INSTRUCTOR')
public async deleteCourse(
    @Param('courseId') courseId:string,
    @CurrentUser()payload:PayloadType
){
    return this.courseService.deleteCourse(courseId,payload)
}

@Patch('restore/:courseId')
@UseGuards(AuthGuard,RolesGuard)
@userRoles('INSTRUCTOR')
public async restoreCourse(
    @Param('courseId') courseId:string,
    @CurrentUser() payload:PayloadType
){
    return this.courseService.restoreCourse(courseId,payload)
}
}