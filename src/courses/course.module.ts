import { Module } from "@nestjs/common";
import { CourseController } from "./course.controller.js";
import { CourseService } from "./course.service.js";
import { PrismaService } from "../prisma.service.js";
import { UserModule } from "../users/user.module.js";
import { UploadFileModule } from "../uploads/upload.module.js";
import { RedisService } from "../redis/redis.service.js";

@Module({
    imports:[UserModule,UploadFileModule],
    controllers:[CourseController],
    providers:[CourseService,PrismaService,RedisService],
    exports:[CourseService]
})
export class CourseModule {
    
}