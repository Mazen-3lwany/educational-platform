import { Module } from "@nestjs/common";
import { EnrollController} from "./enroll.controller.js"
import { EnrollService } from "./enroll.service.js";
import { PrismaService } from "../prisma.service.js";
import { UserModule } from "../users/user.module.js";
import { CourseModule } from "../courses/course.module.js";

@Module({
    imports:[UserModule,CourseModule],
    controllers:[EnrollController],
    providers:[EnrollService,PrismaService]
})
export class EnrollModule { }