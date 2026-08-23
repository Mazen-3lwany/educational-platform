import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { FileUploadService } from "../uploads/upload.service.js";
import { PayloadType } from "../utils/types.js";
import { createLessonDto } from "./dto/createLesson.dto.js";
import { FileType, Roles } from "../../generated/prisma/enums.js";
import { CourseService } from "../courses/course.service.js";
import { updateLessonDto } from "./dto/updateLesson.dto.js";
import { RedisService } from "../redis/redis.service.js";

@Injectable()
export class LessonService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: FileUploadService,
        private readonly courseService: CourseService,
        private readonly Redis: RedisService
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
                await this.Redis.del(`lesson:course:${courseId}`)

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

    public async getLessonById(lessonId: string) {
        const cachedKey = `lessons:${lessonId}`
        const cachedLesson = await this.Redis.get(cachedKey)
        if (cachedLesson) {
            console.log('Cache Hit')
            return JSON.parse(cachedLesson)
        }
        console.log('Cache Miss')
        const lesson = await this.prisma.lesson.findFirst(
            {
                where: {
                    id: lessonId,
                    isDeleted: false
                },
                include:
                {

                    course: {
                        select: {
                            id: true,
                            instructorId: true,
                            title: true
                        }
                    },
                    files: true
                }
            }
        )
        if (!lesson)
            throw new NotFoundException('lesson not found')
        await this.Redis.set(cachedKey, JSON.stringify(lesson), 300)
        return lesson
    }

    public async getLessonsBycourseId(courseId: string) {
        const cachedKey = `lesson:course:${courseId}`
        const cachedLessons = await this.Redis.get(cachedKey)
        if (cachedLessons) {
            console.log("Cache Hit")
            return JSON.parse(cachedLessons)
        }
        console.log('Cache Miss')

        const lessons = await this.prisma.lesson.findMany({
            where: {
                courseId,
                isDeleted: false,
            },
            orderBy: {
                order: 'asc'
            },
            include: {
                files: true
            }
        })
        await this.Redis.set(cachedKey, JSON.stringify(lessons), 300)
        return lessons;
    }
    // update lesson
    public async updateLesson(lessonId: string, updateLessonData: updateLessonDto, payload: PayloadType) {
        if (
            updateLessonData.title === undefined &&
            updateLessonData.description === undefined
        ) {
            throw new BadRequestException('No data provided to update');
        }
        if (payload.role !== Roles.INSTRUCTOR)
            throw new ForbiddenException('Not Allowed')
        const lesson = await this.prisma.lesson.findFirst({
            where: {
                id: lessonId,
                isDeleted: false
            },
            include: {
                course: {
                    select: {
                        instructorId: true
                    }
                }
            }
        });
        if (!lesson) {
            throw new NotFoundException('Lesson not found');
        }
        if (lesson.course.instructorId !== payload.id)
            throw new ForbiddenException('You can not upadte this lesson')
        const data: any = {};

        if (updateLessonData.title !== undefined) {
            data.title = updateLessonData.title;
        }

        if (updateLessonData.description !== undefined) {
            data.description = updateLessonData.description;
        }
        const updatedLesson = await this.prisma.lesson.update({
            where: { id: lessonId },
            data
        })
        // Invalidate the cache for this lesson and its course
        await this.Redis.del(`lessons:${lessonId}`);
        await this.Redis.del(`lesson:course:${lesson.courseId}`);
        return updatedLesson
    }

    public async addFilesToLesson(files: Express.Multer.File[], lessonId: string, payload: PayloadType) {
        if (payload.role !== Roles.INSTRUCTOR)
            throw new ForbiddenException('Not allowed')
        if (!files || files.length === 0)
            throw new BadRequestException('you can not add file without data')
        const lesson = await this.prisma.lesson.findFirst({
            where: {
                id: lessonId,
                isDeleted: false
            },
            include: {
                course: {
                    select: {
                        id: true,
                        instructorId: true
                    }
                }
            }
        })
        if (!lesson) {
            throw new NotFoundException('Lesson not Found')
        }
        if (lesson.course.instructorId !== payload.id)
            throw new ForbiddenException('You can not add files')
        let uploadfiles: any[] = [];
        try {
            uploadfiles = await Promise.all(
                files.map((file) => this.uploadService.uploadFile(file))
            )
        } catch (err) {
            console.error('Upload error:', err);
            throw new InternalServerErrorException('File upload failed');
        }
        try {
            const lessonFile = await this.prisma.lessonFile.createMany({
                data: uploadfiles.map(file => ({
                    lessonId,
                    url: file.secure_url,
                    name: file.original_filename,
                    type: this.mapFileType(file),
                    publicId: file.public_id
                }))
            })
            // Invalidate the cache for this lesson and its course
            await this.Redis.del(`lessons:${lessonId}`);
            await this.Redis.del(`lesson:course:${lesson.courseId}`);
            return lessonFile
        } catch (err) {
            // cleanup files

            await Promise.all(
                uploadfiles.map(file =>
                    this.uploadService.deleteFile(file.public_id as string)
                )
            );
            throw err;
        }
    }
    public async deleteFileFromLesson(lessonId: string, payload: PayloadType, fileId: string) {
        if (payload.role !== Roles.INSTRUCTOR)
            throw new ForbiddenException('Not Allowed')
        const lesson = await this.prisma.lesson.findFirst({
            where: {
                id: lessonId,
                isDeleted: false
            },
            include: {
                course: {
                    select: {
                        instructorId: true
                    }
                }
            }
        })
        if (!lesson)
            throw new NotFoundException('Lesson Not found')
        if (lesson.course.instructorId !== payload.id)
            throw new ForbiddenException("You cannot delete files from this lesson")

        const file = await this.prisma.lessonFile.findFirst({
            where: {
                id: fileId,
                lessonId: lessonId
            }
        });

        if (!file) {
            throw new NotFoundException('File not found in this lesson');
        }

        try {
            await this.uploadService.deleteFile(file.publicId)

            await this.prisma.lessonFile.delete({
                where: {
                    id: fileId
                }
            })
            // Invalidate the cache for this lesson and its course
            await this.Redis.del(`lessons:${lessonId}`);
            await this.Redis.del(`lesson:course:${lesson.courseId}`);
            return {
                message: "File deleted successfully"
            }
        } catch (err) {
            console.error('Delete file error:', err)
            throw new InternalServerErrorException("delete file Failed")
        }
    }
    public async reOrderLesson() {

    }
    // reOrder

}