import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { LessonService } from "../lessons/lesson.service.js";
import { EnrollService } from "../enrollment/enroll.service.js";

import { LessonStatus } from "../../generated/prisma/enums.js";
import { Prisma } from "../../generated/prisma/client.js";

@Injectable()
export class ProgressService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly lessonService: LessonService,
        private readonly enrollService: EnrollService
    ) { }
    /**
     * @Param lessonId:string,studentId:string
     * @desc this method for start the lesson and create a new record in the lessonProgress table
     * @route POST /progress/lessons/:lessonId/start
     */
    public async startLesson(lessonId: string, studentId: string) {
        const lesson = await this.lessonService.getLessonById(lessonId);
        const enrollment = await this.enrollService.findOne(studentId, lesson.courseId);
        if (!enrollment) {
            throw new ForbiddenException("You are not enrolled in this course");
        }
        const progress = await this.prisma.lessonProgress.upsert({
            where: {
                studentId_lessonId: {
                    studentId,
                    lessonId,
                },
            },
            create: {
                lessonId,
                studentId,
                startedAt: new Date(),
                status: LessonStatus.IN_PROGRESS,
            },
            update: {
                lastWatchedAt: new Date(),
            },
        });
        return {
            message: "Lesson started successfully",
            progress
        };
    }
    /**
     * @Param lessonId:string,studentId:string
     * @desc this method for complete the lesson and update the record in the lessonProgress table
     * @route POST /progress/lessons/:lessonId/complete
     */
    public async completeLesson(lessonId: string, studentId: string) {
        const lesson = await this.lessonService.getLessonById(lessonId);
        const enrollment = await this.enrollService.findOne(studentId, lesson.courseId);
        if (!enrollment) {
            throw new ForbiddenException("You are not enrolled in this course");
        }
        const existingProgress =
            await this.prisma.lessonProgress.findUnique({
                where: {
                    studentId_lessonId: {
                        studentId,
                        lessonId,
                    },
                },
            });

        if (!existingProgress) {
            throw new BadRequestException(
                'Lesson has not been started yet',
            );
        }

        if (
            existingProgress.status ===
            LessonStatus.COMPLETED
        ) {
            return {
                message: 'Lesson already completed',
                progress: existingProgress,
            };
        }

        const progress = await this.prisma.lessonProgress.update({
            where: {
                studentId_lessonId: {
                    studentId,
                    lessonId,
                },
            },
            data: {
                completedAt: new Date(),
                status: LessonStatus.COMPLETED,
                lastWatchedAt: new Date(),
            },
        });

        return {
            message: "Lesson completed successfully",
            progress
        };
    }

    /**
     * @Param lessonId:string,studentId:string
     * @desc this method for update the watch time of the lesson and update the record in the lessonProgress table
     * @route PATCH /progress/lessons/:lessonId/watch-time
     */
    public async updateWatchTime(
        lessonId: string,
        studentId: string,
        watchTime: number,
    ) {
        const lesson =
            await this.lessonService.getLessonById(
                lessonId,
            );

        const enrollment =
            await this.enrollService.findOne(
                studentId,
                lesson.courseId,
            );

        if (!enrollment) {
            throw new ForbiddenException('You are not enrolled in this course');
        }

        try {
            const progress =
                await this.prisma.lessonProgress.update({
                    where: {
                        studentId_lessonId: {
                            studentId,
                            lessonId,
                        },
                    },
                    data: {
                        watchTime: {
                            increment: watchTime,
                        },
                        lastWatchedAt: new Date(),
                    },
                });

            return {
                message:
                    'Watch time updated successfully',
                progress,
            };
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                throw new BadRequestException(
                    'Lesson has not been started yet',
                );
            }
            throw error;
        }
    }
    /**
     * @Param lessonId:string,studentId:string
     * @desc this method for get the progress of the lesson for a specific student
     * @route GET /progress/lessons/:lessonId/progress
     */
    public async getLessonProgress(
        lessonId: string,
        studentId: string,
    ) {
        const lesson =
            await this.lessonService.getLessonById(
                lessonId,
            );
        const enrollment =
            await this.enrollService.findOne(
                studentId,
                lesson.courseId,
            );
        if (!enrollment) {
            throw new ForbiddenException('You are not enrolled in this course');
        }
        const progress =
            await this.prisma.lessonProgress.findUnique({
                where: {
                    studentId_lessonId: {
                        studentId,
                        lessonId,
                    },
                },
            });
        if (!progress) {
            return {
                message: 'Lesson has not been started yet',
                progress: null,
            };
        }
        return {
            message: 'Lesson progress retrieved successfully',
            progress,
        };
    }
    /**
     * @Param studentId:string
     * @desc this method for get all the progress of the student for all lessons
     * @route GET /progress/students/:studentId
     */
    public async getAllProgressForStudent(studentId: string) {
        const progress =
            await this.prisma.lessonProgress.findMany({
                where: {
                    studentId,
                },
            });
        return {
            message: 'All progress for student retrieved successfully',
            progress,
        };
    }
}

