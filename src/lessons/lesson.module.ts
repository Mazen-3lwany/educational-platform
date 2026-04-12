import { Module } from "@nestjs/common";
import { LessonController } from "./lesson.controller.js";
import { LessonService } from "./lesson.service.js";
import { PrismaService } from "../prisma.service.js";

@Module({
    controllers:[LessonController],
    providers:[LessonService,PrismaService]
})
export class LessonModule{}