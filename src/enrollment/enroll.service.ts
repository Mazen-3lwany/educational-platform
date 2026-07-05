import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { CourseService } from "../courses/course.service.js";

import { Prisma } from "../../generated/prisma/client.js";

@Injectable()
export class EnrollService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly courseService: CourseService,


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


    public async findAllCoursesForStudent(studentId: string, page: number, limit: number) {
        page = Math.max(page, 1);
        limit = Math.min(Math.max(limit, 1), 50);
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


    public async unenrollCourse(userId:string,courseId:string){
        try{
            await this.prisma.enrollment.delete({
                where:{
                    studentId_courseId:{
                        studentId:userId,
                        courseId
                    }
                }
            })
            return {
                success:true,
                message:'Successfully unenrolled'
            }
        }catch(error){
            if(error instanceof Prisma.PrismaClientKnownRequestError){
                if(error.code === 'P2025') throw new NotFoundException('Enrollment not found');
            }
            throw error
        }
    }
    public async findOne(studentId:string,courseId:string){
        return await this.prisma.enrollment.findUnique({
            where:{
                studentId_courseId:{
                    studentId,
                    courseId
                }
            }
        })
    }
}