import { Module } from "@nestjs/common";
import { LessonController } from "./lesson.controller.js";
import { LessonService } from "./lesson.service.js";
import { PrismaService } from "../prisma.service.js";
import { CourseModule } from "../courses/course.module.js";
import { UploadFileModule } from "../uploads/upload.module.js";
import { RedisService } from "../redis/redis.service.js";

@Module({
    imports:[CourseModule,UploadFileModule],
    controllers:[LessonController],
    providers:[LessonService,PrismaService,RedisService],
    exports:[LessonService]
})
export class LessonModule{}