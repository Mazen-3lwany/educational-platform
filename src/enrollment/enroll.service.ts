import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { CourseService } from "../courses/course.service.js";
import { UserService } from "../users/user.service.js";
import { Prisma } from "../../generated/prisma/client.js";

@Injectable()
export class EnrollService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly courseService: CourseService,
        private readonly userService: UserService

    ) { }
    public async enrollCourse(userId: string, courseId: string) {
        const course = await this.courseService.getCourseById(courseId)
        if (!course) throw new NotFoundException("Course Not Exist")

        try {
            const enrolledCourse = await this.prisma.enrollment.create({
                data: {
                    studentId: userId,
                    courseId
                }
            })
            return enrolledCourse
        } catch (error) {

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new BadRequestException('Already Enrolled');
                }
            }
            throw error;
        }
    }


    public async findAllCourseForStudent(studentId: string, page: number, limit: number) {
        const [courses, total] = await Promise.all([
            this.prisma.enrollment.findMany({
                where: { studentId },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    course: true
                }
            }),
            this.prisma.enrollment.count({
                where: { studentId }
            })
        ])
        return { courses, total, page, limit };
    }
    public async findAllStudentsForCourse(courseId: string, page: number, limit: number) {
        const course = await this.courseService.getCourseById(courseId)
        page = Math.max(page, 1);
        limit = Math.min(Math.max(limit, 1), 50);
        if (!course) throw new NotFoundException('Course Not Found')
        const [students, total] = await Promise.all([
            this.prisma.enrollment.findMany({
                where: { courseId },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    student: true
                }
            }),
            this.prisma.enrollment.count({
                where: {
                    courseId
                }
            })
        ])

        return { students, total, page, limit };
    }

}