import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { FileUploadService } from "../uploads/upload.service.js";
import { PayloadType } from "../utils/types.js";
import { createLessonDto } from "./dto/createLesson.dto.js";
import { FileType, Roles } from "../../generated/prisma/enums.js";
import { CourseService } from "../courses/course.service.js";

@Injectable()
export class LessonService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: FileUploadService,
        private readonly courseService: CourseService
    ) { }

    public async createLesson(
        courseId: string,
        payload: PayloadType,
        lessonData: createLessonDto,
        files?: Express.Multer.File[]
    ) {
        if (payload.role !== Roles.INSTRUCTOR)
            throw new ForbiddenException("Not Allowed")
        const course = await this.courseService.getCourseById(courseId)
        if (payload.id !== course.instructorId)
            throw new ForbiddenException("You are not allowed to create lesson inside this course")
        // dynamic order calculation
        const lastLesson = await this.prisma.lesson.findFirst({
            where: { courseId },
            orderBy: { order: 'desc' }
        });
        const order = lastLesson ? lastLesson.order + 1 : 1;

        let uploadedFiles: any[] = [];
        if (files?.length) {
            try {
                uploadedFiles = await Promise.all(
                    files.map(file => this.uploadService.uploadFile(file))
                );
            } catch {
                throw new InternalServerErrorException('File upload failed');
            }
        }
        try {
            const lesson = await this.prisma.$transaction(async (tx) => {
                const newLesson = await tx.lesson.create({
                    data: {
                        courseId,
                        title: lessonData.title,
                        description: lessonData.description,
                        order
                    }
                });

                if (uploadedFiles.length > 0) {
                    await tx.lessonFile.createMany({
                        data: uploadedFiles.map(file => ({
                            lessonId: newLesson.id,
                            url: file.secure_url,
                            name: file.original_filename,
                            type: this.mapFileType(file),
                            publicId: file.public_id
                        }))
                    });
                }

                return newLesson;
            });

            return lesson;

        } catch (err) {
            // cleanup files

            await Promise.all(
                uploadedFiles.map(file =>
                    this.uploadService.deleteFile(file.public_id as string)
                )
            );

            throw err;
        }
    }
    private mapFileType(file: any): FileType {
        switch (file.resource_type) {
            case 'video':
                return FileType.VIDEO;
            case 'image':
                return FileType.IMAGE;
            case 'raw':
                return FileType.PDF;
            default:
                return FileType.PDF;
        }
    }
    public async getLessonById(lessonId:string){
        const lesson=await this.prisma.lesson.findFirst(
            {
                where:{
                    id:lessonId,
                    isDeleted:false
                },
                include:
                {
                    
                    course:{
                        select:{
                            id:true,
                            instructorId:true,
                            title:true
                        }
                    },
                    files:true
                }
            }
        )
        if(!lesson)
            throw new NotFoundException('lesson not found')
        return lesson
    }
    public async getLessonsBycourseId(courseId:string){
        const lessons=await this.prisma.lesson.findMany({
            where:{
                courseId,
                isDeleted:false,
            },
            orderBy:{
                order:'asc'
            },
            include:{
                files:true
            }
        })
        return lessons;
    }
}