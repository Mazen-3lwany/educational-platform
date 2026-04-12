import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";

@Injectable()
export class LessonService{
    constructor(private readonly prisma:PrismaService){}
    
}