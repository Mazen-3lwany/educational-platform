import { Module } from "@nestjs/common";
import { ProgressController } from "./progress.controller.js";
import { ProgressService } from "./progress.service.js";
import { PrismaService } from "../prisma.service.js";

@Module({
    controllers:[ProgressController],
    providers:[ProgressService,PrismaService]
})
export class ProgressModule{}