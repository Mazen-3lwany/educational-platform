import { Module } from "@nestjs/common";
import { ProgressController } from "./progress.controller.js";
import { ProgressService } from "./progress.service.js";
import { PrismaService } from "../prisma.service.js";
import { EnrollModule } from "../enrollment/enroll.module.js";
import { LessonModule } from "../lessons/lesson.module.js";

@Module({
    imports:[LessonModule,EnrollModule],
    controllers:[ProgressController],
    providers:[ProgressService,PrismaService]
})
export class ProgressModule{}