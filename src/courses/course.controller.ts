import { BadRequestException, Body, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { CourseService } from "./course.service.js";
import { CurrentUser } from "../auth/decorators/currentUser.decorator.js";
import {type PayloadType } from "../utils/types.js";
import { AuthGuard } from "../auth/guards/auth.guard.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { userRoles } from "../auth/decorators/roles.decorator.js";
import { Roles } from "../../generated/prisma/enums.js";
import { FileInterceptor } from "@nestjs/platform-express";
import { createCourseDTO } from "./dtos/createCourse.dto.js";

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
        console.log("Controller reached");
        return await this.courseService.createCourse(payload,courseData,file)
    }
}